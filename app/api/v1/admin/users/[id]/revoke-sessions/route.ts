import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { executeSessionRevoke } from "@/lib/admin-security-policy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;

  const { id: targetId } = await params;
  const result = await prisma.$transaction(async (tx) => {
    // Re-read both protected flags and the actor's Super Admin role in the DB.
    const actor = await tx.user.findUnique({
      where: { id: access.context.userId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        isProtectedSuperAdmin: true,
        roles: {
          where: { role: { scope: "ADMIN" } },
          select: { role: { select: { id: true, name: true, slug: true, isSuperAdmin: true } } },
        },
      },
    });
    const target = await tx.user.findFirst({
      where: { id: targetId, roles: { some: { role: { scope: "ADMIN" } } } },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        isProtectedSuperAdmin: true,
        roles: {
          where: { role: { scope: "ADMIN" } },
          select: { role: { select: { id: true, name: true, slug: true, isSuperAdmin: true } } },
        },
      },
    });
    if (!target) return { kind: "NOT_FOUND" as const };

    const actorIsSuperAdmin = Boolean(actor?.roles.some(({ role }) => role.isSuperAdmin));
    const auditActor = actor
      ? {
          userId: actor.id,
          name: actor.name,
          email: actor.email,
          isSuperAdmin: actorIsSuperAdmin,
          roles: actor.roles.map(({ role }) => role),
        }
      : access.context;
    const execution = await executeSessionRevoke({
      actorUserId: access.context.userId,
      targetUserId: target.id,
      actorIsActive: actor?.isActive ?? false,
      actorIsSuperAdmin,
      actorIsProtectedSuperAdmin: actor?.isProtectedSuperAdmin ?? false,
      targetIsProtectedSuperAdmin: target.isProtectedSuperAdmin,
    }, async () => {
      const deleted = await tx.session.deleteMany({ where: { userId: target.id } });
      await appendAdminAuditLog(tx, {
        actor: auditActor,
        request,
        action: "user.sessions_revoked",
        category: "USER_ACCESS",
        riskLevel: "HIGH",
        description: `Revoked ${deleted.count} active session(s) for ${target.name}.`,
        targetType: "USER",
        targetId: target.id,
        targetName: target.name,
        targetEmail: target.email,
        beforeState: { activeSessionCount: deleted.count, isProtectedSuperAdmin: target.isProtectedSuperAdmin },
        afterState: { activeSessionCount: 0, isProtectedSuperAdmin: target.isProtectedSuperAdmin },
        changedFields: ["sessions"],
      });
      return deleted.count;
    }, async (decision) => {
      await appendAdminAuditLog(tx, {
        actor: auditActor,
        request,
        action: "user.sessions_revoke_denied",
        category: "USER_ACCESS",
        riskLevel: "CRITICAL",
        description:
          decision === "PROTECTED_SUPER_ADMIN_TARGET"
            ? `Rejected session revocation for Protected Super Admin ${target.name}.`
            : decision === "SELF_TARGET"
              ? "Rejected a request to revoke the actor's own sessions."
              : "Rejected session revocation because the actor no longer has active Super Admin access.",
        targetType: "USER",
        targetId: target.id,
        targetName: target.name,
        targetEmail: target.email,
        beforeState: {
          actorIsActive: actor?.isActive ?? false,
          actorIsSuperAdmin,
          actorIsProtectedSuperAdmin: actor?.isProtectedSuperAdmin ?? false,
          targetIsProtectedSuperAdmin: target.isProtectedSuperAdmin,
        },
        afterState: null,
        changedFields: [],
        success: false,
        failureCode: decision,
      });
    });
    if (!execution.allowed) {
      return { kind: "FORBIDDEN" as const, decision: execution.decision };
    }
    return { kind: "SUCCESS" as const, revoked: execution.result };
  }, { isolationLevel: "Serializable" });

  if (result.kind === "NOT_FOUND") {
    return NextResponse.json({ error: "Admin or Staff account not found." }, { status: 404 });
  }
  if (result.kind === "FORBIDDEN") {
    return NextResponse.json(
      {
        error:
          result.decision === "PROTECTED_SUPER_ADMIN_TARGET"
            ? "Only the Protected Super Admin can revoke this account's sessions."
            : result.decision === "SELF_TARGET"
              ? "You cannot revoke your own sessions."
              : "Active Super Admin access is required.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ revoked: result.revoked });
}
