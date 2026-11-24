import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { ADMIN_PERMISSION_KEY_SET } from "@/lib/admin-permission-catalog";
import { appendAdminAuditLog } from "@/lib/admin-audit";

const schema = z.object({ permissionIds: z.array(z.string().uuid()).max(100).refine((ids) => new Set(ids).size === ids.length) });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Role not found." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Permission assignments are invalid." }, { status: 400 });
  const role = await prisma.role.findUnique({ where: { id }, select: { id: true, scope: true, isSuperAdmin: true } });
  if (!role || role.scope !== "ADMIN") return NextResponse.json({ error: "Role not found." }, { status: 404 });
  if (role.isSuperAdmin) return NextResponse.json({ error: "The protected Super Admin permissions cannot be changed." }, { status: 403 });
  const permissions = await prisma.permission.findMany({ where: { id: { in: parsed.data.permissionIds } }, select: { id: true, name: true, resource: true, action: true } });
  const catalogPermissions = permissions.filter(({ resource, action }) => ADMIN_PERMISSION_KEY_SET.has(`${resource}:${action}`));
  if (catalogPermissions.length !== parsed.data.permissionIds.length) return NextResponse.json({ error: "One or more permissions are not in the catalog." }, { status: 400 });
  await prisma.$transaction(async (tx) => {
    const before = await tx.role.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, permissions: { select: { permission: { select: { id: true, resource: true, action: true, name: true } } } } },
    });
    await tx.rolePermission.deleteMany({ where: { roleId: id } });
    if (catalogPermissions.length) await tx.rolePermission.createMany({ data: catalogPermissions.map(({ id: permissionId }) => ({ roleId: id, permissionId })) });
    const previousIds = new Set(before.permissions.map(({ permission }) => permission.id));
    const nextIds = new Set(catalogPermissions.map(({ id: permissionId }) => permissionId));
    const added = catalogPermissions.filter(({ id: permissionId }) => !previousIds.has(permissionId));
    const removed = before.permissions.map(({ permission }) => permission).filter(({ id: permissionId }) => !nextIds.has(permissionId));
    await appendAdminAuditLog(tx, {
      actor: access.context, request, action: "role.permissions_updated", category: "RBAC", riskLevel: "CRITICAL",
      description: `Updated permissions for role ${before.name}.`, targetType: "ROLE", targetId: id, targetName: before.name,
      roleId: id, roleName: before.name,
      beforeState: before.permissions.map(({ permission }) => `${permission.resource}:${permission.action}`),
      afterState: catalogPermissions.map(({ resource, action }) => `${resource}:${action}`),
      changedFields: { added: added.map(({ resource, action }) => `${resource}:${action}`), removed: removed.map(({ resource, action }) => `${resource}:${action}`) },
    });
    for (const permission of added) await appendAdminAuditLog(tx, {
      actor: access.context, request, action: "permission.granted", category: "RBAC", riskLevel: "CRITICAL",
      description: `Granted ${permission.resource}:${permission.action} to role ${before.name}.`, targetType: "PERMISSION", targetId: permission.id,
      targetName: permission.name, roleId: id, roleName: before.name, permissionId: permission.id,
      permissionKey: `${permission.resource}:${permission.action}`, beforeState: { assigned: false }, afterState: { assigned: true },
    });
    for (const permission of removed) await appendAdminAuditLog(tx, {
      actor: access.context, request, action: "permission.revoked", category: "RBAC", riskLevel: "HIGH",
      description: `Revoked ${permission.resource}:${permission.action} from role ${before.name}.`, targetType: "PERMISSION", targetId: permission.id,
      targetName: permission.name, roleId: id, roleName: before.name, permissionId: permission.id,
      permissionKey: `${permission.resource}:${permission.action}`, beforeState: { assigned: true }, afterState: { assigned: false },
    });
  });
  return NextResponse.json({ saved: true });
}
