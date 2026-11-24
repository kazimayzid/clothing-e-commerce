import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_PERMISSION_CATALOG, ADMIN_PERMISSION_KEY_SET } from "@/lib/admin-permission-catalog";
import { appendAdminAuditLog } from "@/lib/admin-audit";

export type AdminAccessContext = {
  userId: string;
  email: string;
  name: string;
  isActive: boolean;
  isProtectedSuperAdmin: boolean;
  isSuperAdmin: boolean;
  roles: { id: string; name: string; slug: string; isSuperAdmin: boolean }[];
  permissions: Set<string>;
};

export const hasPermission = (context: AdminAccessContext, permission: string) =>
  context.isSuperAdmin || context.permissions.has(permission);

export async function getAdminAccessContext(userId?: string): Promise<AdminAccessContext | null> {
  const session = userId
    ? null
    : await auth.api.getSession({ headers: await headers() });
  const id = userId ?? session?.user.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      isProtectedSuperAdmin: true,
      roles: {
        where: { role: { scope: "ADMIN" } },
        select: {
          role: {
            select: {
              id: true,
              name: true,
              slug: true,
              isSuperAdmin: true,
              permissions: {
                select: { permission: { select: { resource: true, action: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!user) return null;

  const roles = user.roles.map(({ role }) => ({
    id: role.id,
    name: role.name,
    slug: role.slug,
    isSuperAdmin: role.isSuperAdmin,
  }));
  const isSuperAdmin = roles.some((role) => role.isSuperAdmin);
  const permissions = new Set(
    user.roles.flatMap(({ role }) =>
      role.permissions
        .map(({ permission }) => `${permission.resource}:${permission.action}`)
        .filter((key) => ADMIN_PERMISSION_KEY_SET.has(key)),
    ),
  );
  if (isSuperAdmin) {
    for (const permission of ADMIN_PERMISSION_CATALOG) {
      permissions.add(`${permission.resource}:${permission.action}`);
    }
  }

  return { userId: user.id, email: user.email, name: user.name, isActive: user.isActive, isProtectedSuperAdmin: user.isProtectedSuperAdmin, isSuperAdmin, roles, permissions };
}

export async function requireAdminApiPermission(permission: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  }
  const context = await getAdminAccessContext(session.user.id);
  if (!context?.isActive || context.roles.length === 0) {
    return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) } as const;
  }
  if (!hasPermission(context, permission)) {
    return { response: NextResponse.json({ error: "You do not have permission to perform this action." }, { status: 403 }) } as const;
  }
  return { context } as const;
}

export async function requireSuperAdminApi() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  }
  const context = await getAdminAccessContext(session.user.id);
  if (!context?.isActive || !context.isSuperAdmin) {
    if (context?.isActive) {
      try {
        await appendAdminAuditLog(prisma, {
          actor: context,
          action: "authorization.super_admin_required",
          category: "AUTHORIZATION",
          riskLevel: "HIGH",
          description: "A signed-in account without Super Admin status attempted to use a Super Admin-only endpoint.",
          targetType: "ENDPOINT",
          success: false,
          failureCode: "SUPER_ADMIN_REQUIRED",
        });
      } catch (error) {
        console.error("Failed to record denied Super Admin endpoint access", error);
      }
    }
    return { response: NextResponse.json({ error: "Super Admin access required." }, { status: 403 }) } as const;
  }
  return { context } as const;
}
