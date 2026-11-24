import "server-only";

import { prisma } from "@/lib/prisma";
import type { AdminAccessRemovalSummary, AdminInvitationSummary, AdminPermission, AdminRoleSummary, ManagedAdminUser } from "@/components/admin/management/management-types";
import { getAdminAccessContext } from "@/lib/admin-access";
import { ADMIN_PERMISSION_CATALOG } from "@/lib/admin-permission-catalog";

function mapPermission(permission: { id: string; name: string; resource: string; action: string; description?: string | null }): AdminPermission {
  return { id: permission.id, name: permission.name, resource: permission.resource, action: permission.action, description: permission.description };
}

export async function getUserPermissionKeys(userId: string) {
  const access = await getAdminAccessContext(userId);
  return [...(access?.permissions ?? [])];
}

export async function getAdminRoleData(): Promise<{ roles: AdminRoleSummary[]; permissionCatalog: AdminPermission[] }> {
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      where: { scope: "ADMIN" },
      orderBy: { name: "asc" },
      include: {
        permissions: { where: { permission: { OR: ADMIN_PERMISSION_CATALOG.map(({ resource, action }) => ({ resource, action })) } }, select: { permission: { select: { id: true, name: true, resource: true, action: true, description: true } } } },
        _count: { select: { users: true } },
      },
    }),
    prisma.permission.findMany({ where: { OR: ADMIN_PERMISSION_CATALOG.map(({ resource, action }) => ({ resource, action })) }, orderBy: [{ resource: "asc" }, { action: "asc" }] }),
  ]);

  return {
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      scope: "ADMIN" as const,
      isSuperAdmin: role.isSuperAdmin,
      description: role.description,
      createdAt: role.createdAt.toISOString(),
      assignedUserCount: role._count.users,
      permissions: role.permissions.map(({ permission }) => mapPermission(permission)),
    })),
    permissionCatalog: permissions.map(mapPermission),
  };
}

export async function getManagedAdminUsers(): Promise<ManagedAdminUser[]> {
  const users = await prisma.user.findMany({
    where: {
      roles: { some: { role: { scope: "ADMIN" } } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      isActive: true,
      isProtectedSuperAdmin: true,
      createdAt: true,
      roles: {
        where: { role: { scope: "ADMIN" } },
        select: {
          role: {
            select: {
              id: true,
              name: true,
              slug: true,
              scope: true,
              isSuperAdmin: true,
              permissions: { where: { permission: { OR: ADMIN_PERMISSION_CATALOG.map(({ resource, action }) => ({ resource, action })) } }, select: { permission: { select: { id: true, name: true, resource: true, action: true, description: true } } } },
            },
          },
        },
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    isProtectedSuperAdmin: user.isProtectedSuperAdmin,
    createdAt: user.createdAt.toISOString(),
    roles: user.roles.map(({ role }) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      scope: role.scope,
      isSuperAdmin: role.isSuperAdmin,
      permissions: role.permissions.map(({ permission }) => mapPermission(permission)),
    })),
  }));
}

export async function getAdminInvitations(): Promise<AdminInvitationSummary[]> {
  const now = new Date();
  await prisma.adminInvitation.updateMany({ where: { status: "PENDING", expiresAt: { lte: now } }, data: { status: "EXPIRED" } });
  const invitations = await prisma.adminInvitation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { roles: { include: { role: { select: { id: true, name: true, slug: true } } } } },
  });
  return invitations.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    name: invitation.name,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    sentAt: invitation.sentAt?.toISOString() ?? null,
    emailProvider: invitation.emailProvider as "SMTP" | "RESEND",
    emailStatus: invitation.emailStatus,
    providerEmailId: invitation.providerEmailId,
    emailAttemptedAt: invitation.emailAttemptedAt?.toISOString() ?? null,
    lastEmailError: invitation.lastEmailError,
    createdAt: invitation.createdAt.toISOString(),
    roles: invitation.roles.map(({ role }) => role),
  }));
}

export async function getAdminAccessRemovals(): Promise<AdminAccessRemovalSummary[]> {
  const removals = await prisma.adminAccessRemoval.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return removals.map((removal) => ({
    id: removal.id,
    recipientEmail: removal.recipientEmail,
    recipientName: removal.recipientName,
    removedRoles: Array.isArray(removal.removedRoles)
      ? removal.removedRoles.flatMap((role) => {
          if (!role || typeof role !== "object") return [];
          const item = role as { id?: unknown; name?: unknown };
          return typeof item.id === "string" && typeof item.name === "string"
            ? [{ id: item.id, name: item.name }]
            : [];
        })
      : [],
    emailStatus: removal.emailStatus,
    providerEmailId: removal.providerEmailId,
    emailAttemptedAt: removal.emailAttemptedAt?.toISOString() ?? null,
    lastEmailError: removal.lastEmailError,
    createdAt: removal.createdAt.toISOString(),
  }));
}
