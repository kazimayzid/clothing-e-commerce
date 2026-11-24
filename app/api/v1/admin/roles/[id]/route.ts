import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  description: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Role not found." }, { status: 404 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Role details are invalid." }, { status: 400 });
  const role = await prisma.role.findUnique({ where: { id }, select: { id: true, name: true, slug: true, description: true, isSuperAdmin: true, scope: true } });
  if (!role || role.scope !== "ADMIN") return NextResponse.json({ error: "Role not found." }, { status: 404 });
  if (role.isSuperAdmin) return NextResponse.json({ error: "The protected Super Admin role cannot be changed." }, { status: 403 });
  const existing = await prisma.role.findFirst({ where: { slug: parsed.data.slug, id: { not: id } }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "A role with this slug already exists." }, { status: 409 });
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.role.update({ where: { id }, data: { name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description || null } });
      await appendAdminAuditLog(tx, {
        actor: access.context, request, action: "role.updated", category: "RBAC", riskLevel: "HIGH",
        description: `Updated admin role ${role.name}.`, targetType: "ROLE", targetId: role.id, targetName: role.name, roleId: role.id, roleName: role.name,
        beforeState: { name: role.name, slug: role.slug, description: role.description }, afterState: { name: changed.name, slug: changed.slug, description: changed.description },
        changedFields: ["name", "slug", "description"],
      });
      return changed;
    });
    return NextResponse.json({ role: updated });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A role with this slug already exists." }, { status: 409 });
    throw error;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Role not found." }, { status: 404 });
  const role = await prisma.role.findUnique({ where: { id }, select: { id: true, scope: true, isSuperAdmin: true, _count: { select: { users: true, invitations: true } } } });
  if (!role || role.scope !== "ADMIN") return NextResponse.json({ error: "Role not found." }, { status: 404 });
  if (role.isSuperAdmin) return NextResponse.json({ error: "The protected Super Admin role cannot be deleted." }, { status: 403 });
  if (role._count.users || role._count.invitations) return NextResponse.json({ error: "Remove this role from users and pending invitation history before deleting it." }, { status: 409 });
  await prisma.$transaction(async (tx) => {
    await tx.role.delete({ where: { id } });
    await appendAdminAuditLog(tx, {
      actor: access.context, request, action: "role.deleted", category: "RBAC", riskLevel: "CRITICAL",
      description: `Deleted admin role ${role.id}.`, targetType: "ROLE", targetId: role.id, targetName: role.id, roleId: role.id,
      beforeState: { id: role.id, scope: role.scope, isSuperAdmin: role.isSuperAdmin }, afterState: null,
    });
  });
  return NextResponse.json({ deleted: true });
}
