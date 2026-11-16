import "server-only";

import { prisma } from "@/lib/prisma";
import type { AdminPermission, AdminRoleSummary, ManagedAdminUser } from "@/components/admin/management/management-types";

function mapPermission(permission: { id: string; name: string; resource: string; action: string }): AdminPermission {
  return { id: permission.id, name: permission.name, resource: permission.resource, action: permission.action };
}

export async function getUserPermissionKeys(userId: string) {
  const assignments = await prisma.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          permissions: {
            select: { permission: { select: { resource: true, action: true } } },
          },
        },
      },
    },
  });

  return [...new Set(assignments.flatMap(({ role }) =>
    role.permissions.map(({ permission }) => `${permission.resource}:${permission.action}`),
  ))];
}

export async function getAdminRoleData(): Promise<{ roles: AdminRoleSummary[]; permissionCatalog: AdminPermission[] }> {
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: { select: { permission: { select: { id: true, name: true, resource: true, action: true } } } },
        _count: { select: { users: true } },
      },
    }),
    prisma.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] }),
  ]);

  return {
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
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
      roles: { some: { role: { slug: { in: ["admin", "staff"] } } } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      roles: {
        select: {
          role: {
            select: {
              id: true,
              name: true,
              slug: true,
              permissions: { select: { permission: { select: { id: true, name: true, resource: true, action: true } } } },
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
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    roles: user.roles.map(({ role }) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      permissions: role.permissions.map(({ permission }) => mapPermission(permission)),
    })),
  }));
}
