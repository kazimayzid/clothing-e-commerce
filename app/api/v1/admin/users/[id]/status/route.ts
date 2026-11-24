import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { decideSuperAdminStatusChange } from "@/lib/admin-security-policy";

const schema = z.object({ isActive: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (id === access.context.userId) {
    await appendAdminAuditLog(prisma, { actor: access.context, request, action: "user.status_change_denied", category: "USER_ACCESS", riskLevel: "HIGH", description: "Rejected an attempt to change the current account status.", targetType: "USER", targetId: id, success: false, failureCode: "SELF_STATUS_CHANGE" });
    return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Account status is invalid." }, { status: 400 });

  try {
    const user = await prisma.$transaction(async (tx) => {
      // Serialize status changes that could affect the final active Super Admin.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(762143, 1)`;
      const target = await tx.user.findFirst({
        where: { id, roles: { some: { role: { scope: "ADMIN" } } } },
        select: { id: true, name: true, email: true, isActive: true, isProtectedSuperAdmin: true, roles: { select: { role: { select: { isSuperAdmin: true } } } } },
      });
      if (!target) return null;
      const targetIsSuperAdmin = target.roles.some(({ role }) => role.isSuperAdmin);
      const activeSuperAdmins = !parsed.data.isActive && target.isActive && targetIsSuperAdmin
        ? await tx.user.count({ where: { isActive: true, roles: { some: { role: { isSuperAdmin: true } } } } })
        : 0;
      const decision = decideSuperAdminStatusChange({
        isDeactivating: !parsed.data.isActive && target.isActive,
        actorIsSuperAdmin: access.context.isSuperAdmin,
        targetIsSuperAdmin,
        targetIsProtectedSuperAdmin: target.isProtectedSuperAdmin,
        activeSuperAdminCount: activeSuperAdmins,
      });
      if (decision === "PROTECTED_ACCOUNT") throw new Error("PROTECTED_SUPER_ADMIN");
      if (decision === "SUPER_ADMIN_ONLY") throw new Error("INSUFFICIENT_PRIVILEGES");
      if (decision === "LAST_ACTIVE_SUPER_ADMIN") throw new Error("LAST_ACTIVE_SUPER_ADMIN");
      const updated = await tx.user.update({ where: { id }, data: { isActive: parsed.data.isActive }, select: { id: true, name: true, email: true, isActive: true } });
      if (!parsed.data.isActive) await tx.session.deleteMany({ where: { userId: id } });
      await appendAdminAuditLog(tx, {
        actor: access.context,
        request,
        action: parsed.data.isActive ? "user.activated" : "user.deactivated",
        category: "USER_ACCESS",
        riskLevel: "HIGH",
        description: `${target.name} account was ${parsed.data.isActive ? "activated" : "deactivated"}.`,
        targetType: "USER",
        targetId: target.id,
        targetName: target.name,
        targetEmail: target.email,
        beforeState: { isActive: target.isActive },
        afterState: { isActive: updated.isActive },
        changedFields: ["isActive"],
      });
      return updated;
    }, { isolationLevel: "Serializable" });
    if (!user) return NextResponse.json({ error: "Admin or Staff account not found." }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    const failureCode = error instanceof Error ? error.message : null;
    if (["PROTECTED_SUPER_ADMIN", "INSUFFICIENT_PRIVILEGES", "LAST_ACTIVE_SUPER_ADMIN"].includes(failureCode ?? "")) {
      try {
        await appendAdminAuditLog(prisma, {
          actor: access.context, request, action: "user.deactivation_denied", category: "USER_ACCESS", riskLevel: "CRITICAL",
          description: "Rejected a request that would change the protected Super Admin safety boundary.", targetType: "USER", targetId: id,
          success: false, failureCode: failureCode ?? "SECURITY_POLICY",
        });
      } catch (auditError) {
        console.error("Failed to record denied Super Admin status change", auditError);
      }
    }
    if (error instanceof Error && error.message === "PROTECTED_SUPER_ADMIN") return NextResponse.json({ error: "This Protected Super Admin account cannot be deactivated." }, { status: 403 });
    if (error instanceof Error && error.message === "INSUFFICIENT_PRIVILEGES") return NextResponse.json({ error: "Only a Super Admin can deactivate another Super Admin." }, { status: 403 });
    if (error instanceof Error && error.message === "LAST_ACTIVE_SUPER_ADMIN") return NextResponse.json({ error: "The last active Super Admin cannot be deactivated." }, { status: 409 });
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") return NextResponse.json({ error: "Account security state changed concurrently. Reload and try again." }, { status: 409 });
    throw error;
  }
}
