import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";

const schema = z.object({ userIds: z.array(z.string().min(1)).max(500).refine((ids) => new Set(ids).size === ids.length) });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApiPermission("users:assign_role");
  if (access.response) return access.response;
  const { id: roleId } = await params;
  if (!z.uuid().safeParse(roleId).success) return NextResponse.json({ error: "Role not found." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "User assignments are invalid." }, { status: 400 });
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true, scope: true, isSuperAdmin: true } });
  if (!role || role.scope !== "ADMIN") return NextResponse.json({ error: "Role not found." }, { status: 404 });
  if (role.isSuperAdmin) return NextResponse.json({ error: "The protected Super Admin role cannot be managed here." }, { status: 403 });
  const users = await prisma.user.findMany({
    where: { id: { in: parsed.data.userIds }, roles: { some: { role: { scope: "ADMIN" } } } },
    select: { id: true },
  });
  if (users.length !== parsed.data.userIds.length) return NextResponse.json({ error: "Only existing Admin or Staff accounts can be assigned to this role." }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    const currentSelfAssignment = await tx.userRole.findUnique({ where: { userId_roleId: { userId: access.context.userId, roleId } }, select: { userId: true } });
    const managedIds = users.map(({ id }) => id).filter((id) => id !== access.context.userId);
    await tx.userRole.deleteMany({ where: { roleId, userId: { not: access.context.userId } } });
    if (managedIds.length) await tx.userRole.createMany({ data: managedIds.map((userId) => ({ userId, roleId })) });
    if (!currentSelfAssignment && parsed.data.userIds.includes(access.context.userId)) {
      // Ignore client attempts to assign the current account to a role.
    }
  });
  return NextResponse.json({ saved: true });
}
