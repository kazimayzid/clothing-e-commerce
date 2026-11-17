import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";
import { ADMIN_PERMISSION_KEY_SET } from "@/lib/admin-permission-catalog";

const schema = z.object({ permissionIds: z.array(z.string().uuid()).max(100).refine((ids) => new Set(ids).size === ids.length) });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApiPermission("roles:assign_permissions");
  if (access.response) return access.response;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Role not found." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Permission assignments are invalid." }, { status: 400 });
  const role = await prisma.role.findUnique({ where: { id }, select: { id: true, scope: true, isSuperAdmin: true } });
  if (!role || role.scope !== "ADMIN") return NextResponse.json({ error: "Role not found." }, { status: 404 });
  if (role.isSuperAdmin) return NextResponse.json({ error: "The protected Super Admin permissions cannot be changed." }, { status: 403 });
  const permissions = await prisma.permission.findMany({ where: { id: { in: parsed.data.permissionIds } }, select: { id: true, resource: true, action: true } });
  const catalogPermissions = permissions.filter(({ resource, action }) => ADMIN_PERMISSION_KEY_SET.has(`${resource}:${action}`));
  if (catalogPermissions.length !== parsed.data.permissionIds.length) return NextResponse.json({ error: "One or more permissions are not in the catalog." }, { status: 400 });
  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: id } });
    if (catalogPermissions.length) await tx.rolePermission.createMany({ data: catalogPermissions.map(({ id: permissionId }) => ({ roleId: id, permissionId })) });
  });
  return NextResponse.json({ saved: true });
}
