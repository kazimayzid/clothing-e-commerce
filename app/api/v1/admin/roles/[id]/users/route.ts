import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";

const schema = z.object({ userIds: z.array(z.string().min(1)).max(500).refine((ids) => new Set(ids).size === ids.length) });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id: roleId } = await params;
  if (!z.uuid().safeParse(roleId).success) return NextResponse.json({ error: "Role not found." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "User assignments are invalid." }, { status: 400 });
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true, name: true, scope: true, isSuperAdmin: true } });
  if (!role || role.scope !== "ADMIN") return NextResponse.json({ error: "Role not found." }, { status: 404 });
  if (role.isSuperAdmin) return NextResponse.json({ error: "The protected Super Admin role cannot be managed here." }, { status: 403 });
  const users = await prisma.user.findMany({
    where: { id: { in: parsed.data.userIds }, roles: { some: { role: { scope: "ADMIN" } } } },
    select: { id: true, name: true, email: true, isProtectedSuperAdmin: true },
  });
  if (users.length !== parsed.data.userIds.length) return NextResponse.json({ error: "Only existing Admin or Staff accounts can be assigned to this role." }, { status: 400 });
  if (users.some(({ isProtectedSuperAdmin }) => isProtectedSuperAdmin)) return NextResponse.json({ error: "The Protected Super Admin account cannot have its role assignments changed." }, { status: 403 });

  await prisma.$transaction(async (tx) => {
    const before = await tx.userRole.findMany({ where: { roleId }, select: { user: { select: { id: true, name: true, email: true } } } });
    const currentSelfAssignment = await tx.userRole.findUnique({ where: { userId_roleId: { userId: access.context.userId, roleId } }, select: { userId: true } });
    const protectedAssignments = await tx.userRole.findMany({ where: { roleId, user: { isProtectedSuperAdmin: true } }, select: { userId: true } });
    const preservedIds = [access.context.userId, ...protectedAssignments.map(({ userId }) => userId)];
    const managedIds = users.map(({ id }) => id).filter((id) => id !== access.context.userId);
    await tx.userRole.deleteMany({ where: { roleId, userId: { notIn: preservedIds } } });
    if (managedIds.length) await tx.userRole.createMany({ data: managedIds.map((userId) => ({ userId, roleId })) });
    if (!currentSelfAssignment && parsed.data.userIds.includes(access.context.userId)) {
      // Ignore client attempts to assign the current account to a role.
    }
    const after = await tx.userRole.findMany({ where: { roleId }, select: { user: { select: { id: true, name: true, email: true } } } });
    await appendAdminAuditLog(tx, {
      actor: access.context, request, action: "role.users_updated", category: "USER_ACCESS", riskLevel: "CRITICAL",
      description: `Updated user assignments for role ${role.name}.`, targetType: "ROLE", targetId: roleId, targetName: role.name, roleId, roleName: role.name,
      beforeState: before.map(({ user }) => user), afterState: after.map(({ user }) => user),
    });
  });
  return NextResponse.json({ saved: true });
}
