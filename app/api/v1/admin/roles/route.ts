import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { ADMIN_PERMISSION_CATALOG, ADMIN_PERMISSION_KEY_SET } from "@/lib/admin-permission-catalog";
import { appendAdminAuditLog } from "@/lib/admin-audit";

const roleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  permissionIds: z.array(z.string().uuid()).max(100).default([]).refine((ids) => new Set(ids).size === ids.length),
});

export async function GET() {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const [roles, permissionCatalog] = await Promise.all([
    prisma.role.findMany({ where: { scope: "ADMIN" }, include: { permissions: { where: { permission: { OR: ADMIN_PERMISSION_CATALOG.map(({ resource, action }) => ({ resource, action })) } }, include: { permission: true } }, _count: { select: { users: true } } }, orderBy: { name: "asc" } }),
    prisma.permission.findMany({ where: { OR: ADMIN_PERMISSION_CATALOG.map(({ resource, action }) => ({ resource, action })) }, orderBy: [{ resource: "asc" }, { action: "asc" }] }),
  ]);
  return NextResponse.json({ roles, permissionCatalog });
}

export async function POST(request: Request) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const parsed = roleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Role details are invalid." }, { status: 400 });
  const permissions = await prisma.permission.findMany({ where: { id: { in: parsed.data.permissionIds } }, select: { id: true, resource: true, action: true } });
  const catalogPermissions = permissions.filter(({ resource, action }) => ADMIN_PERMISSION_KEY_SET.has(`${resource}:${action}`));
  if (catalogPermissions.length !== new Set(parsed.data.permissionIds).size) return NextResponse.json({ error: "One or more permissions are not in the catalog." }, { status: 400 });
  const exists = await prisma.role.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "A role with this slug already exists." }, { status: 409 });
  try {
    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
       data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        scope: "ADMIN",
        permissions: { create: catalogPermissions.map(({ id }) => ({ permission: { connect: { id } } })) },
      },
       include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
      });
      await appendAdminAuditLog(tx, {
        actor: access.context, request, action: "role.created", category: "RBAC", riskLevel: "CRITICAL",
        description: `Created admin role ${created.name}.`, targetType: "ROLE", targetId: created.id, targetName: created.name,
        roleId: created.id, roleName: created.name, beforeState: null,
        afterState: { name: created.name, slug: created.slug, scope: created.scope, permissions: created.permissions.map(({ permission }) => `${permission.resource}:${permission.action}`) },
      });
      return created;
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A role with this slug already exists." }, { status: 409 });
    throw error;
  }
}
