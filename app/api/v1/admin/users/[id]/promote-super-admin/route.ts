import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { canPromoteToSuperAdmin } from "@/lib/admin-module-policy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (!id || id.length > 200) {
    return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
  }

  try {
    const promoted = await prisma.$transaction(async (tx) => {
      // Re-check the actor inside the same transaction immediately before the grant.
      const actor = await tx.user.findUnique({
        where: { id: access.context.userId },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          roles: {
            where: { role: { scope: "ADMIN", isSuperAdmin: true } },
            select: { role: { select: { id: true, name: true, slug: true, isSuperAdmin: true } } },
          },
        },
      });
      if (!actor?.isActive || actor.roles.length === 0) throw new Error("ACTOR_NOT_SUPER_ADMIN");

      const specialRoles = await tx.role.findMany({
        where: { scope: "ADMIN", isSuperAdmin: true },
        select: { id: true, name: true, slug: true },
      });
      if (specialRoles.length !== 1) throw new Error("SUPER_ADMIN_ROLE_NOT_UNIQUE");
      const specialRole = specialRoles[0];

      const target = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          isActive: true,
          isProtectedSuperAdmin: true,
          roles: {
            select: { role: { select: { id: true, name: true, slug: true, scope: true, isSuperAdmin: true } } },
          },
        },
      });
      if (!target) throw new Error("TARGET_NOT_FOUND");

      const targetHasSuperAdmin = target.roles.some(({ role }) => role.isSuperAdmin);
      const eligible = canPromoteToSuperAdmin({
        isActive: target.isActive,
        emailVerified: target.emailVerified,
        isProtectedSuperAdmin: target.isProtectedSuperAdmin,
        hasAdminRole: target.roles.some(({ role }) => role.scope === "ADMIN"),
        hasSuperAdminRole: targetHasSuperAdmin,
      });
      if (!eligible) throw new Error(targetHasSuperAdmin ? "ALREADY_SUPER_ADMIN" : "TARGET_NOT_ELIGIBLE");

      await tx.userRole.create({ data: { userId: target.id, roleId: specialRole.id } });
      await appendAdminAuditLog(tx, {
        actor: {
          userId: actor.id,
          name: actor.name,
          email: actor.email,
          isSuperAdmin: true,
          roles: actor.roles.map(({ role }) => role),
        },
        request,
        action: "user.promoted_to_super_admin",
        category: "USER_ACCESS",
        riskLevel: "CRITICAL",
        description: `${target.name} was promoted to Super Admin by ${actor.name}.`,
        targetType: "USER",
        targetId: target.id,
        targetName: target.name,
        targetEmail: target.email,
        roleId: specialRole.id,
        roleName: specialRole.name,
        beforeState: {
          isActive: target.isActive,
          emailVerified: target.emailVerified,
          isProtectedSuperAdmin: target.isProtectedSuperAdmin,
          roles: target.roles.map(({ role }) => ({ id: role.id, name: role.name, slug: role.slug })),
          isSuperAdmin: false,
        },
        afterState: {
          isActive: target.isActive,
          emailVerified: target.emailVerified,
          isProtectedSuperAdmin: target.isProtectedSuperAdmin,
          roles: [...target.roles.map(({ role }) => ({ id: role.id, name: role.name, slug: role.slug })), { id: specialRole.id, name: specialRole.name, slug: specialRole.slug }],
          isSuperAdmin: true,
        },
        changedFields: ["roles", "isSuperAdmin"],
      });

      return { userId: target.id, roleId: specialRole.id };
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ promoted: true, ...promoted });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "ACTOR_NOT_SUPER_ADMIN") {
      return NextResponse.json({ error: "Super Admin access changed. Sign in again and retry." }, { status: 403 });
    }
    if (code === "TARGET_NOT_FOUND") {
      return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
    }
    if (code === "ALREADY_SUPER_ADMIN") {
      return NextResponse.json({ error: "This account is already a Super Admin." }, { status: 409 });
    }
    if (code === "TARGET_NOT_ELIGIBLE") {
      return NextResponse.json({ error: "Only active, email-verified Admin or Staff accounts can be promoted." }, { status: 409 });
    }
    if (code === "SUPER_ADMIN_ROLE_NOT_UNIQUE") {
      return NextResponse.json({ error: "The special Super Admin role is missing or ambiguous; promotion was not applied." }, { status: 409 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "This account was promoted concurrently. Reload the Admin Users page." }, { status: 409 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "Security state changed concurrently. Reload and try again." }, { status: 409 });
    }
    throw error;
  }
}
