import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";

const schema = z.object({ roleIds: z.array(z.string().uuid()).max(50).refine((ids) => new Set(ids).size === ids.length) });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApiPermission("users:assign_role");
  if (access.response) return access.response;
  const { id: userId } = await params;
  if (userId === access.context.userId) return NextResponse.json({ error: "You cannot change your own role assignments." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Role assignments are invalid." }, { status: 400 });
  const roles = await prisma.role.findMany({ where: { id: { in: parsed.data.roleIds }, scope: "ADMIN", isSuperAdmin: false }, select: { id: true } });
  if (roles.length !== parsed.data.roleIds.length) return NextResponse.json({ error: "One or more roles cannot be assigned to an admin account." }, { status: 400 });
  const target = await prisma.user.findFirst({
    where: { id: userId, roles: { some: { role: { scope: "ADMIN" } } } },
    select: { id: true, roles: { select: { role: { select: { isSuperAdmin: true } } } } },
  });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId, role: { scope: "ADMIN", isSuperAdmin: false } } });
    if (roles.length) await tx.userRole.createMany({ data: roles.map(({ id: roleId }) => ({ userId, roleId })) });
  });
  return NextResponse.json({ saved: true, superAdminAssignmentPreserved: target.roles.some(({ role }) => role.isSuperAdmin) });
}
