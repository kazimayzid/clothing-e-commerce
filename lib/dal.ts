import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


export const getCurrentSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function requireUser() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

const getUserAccess = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      roles: {
        select: {
          role: {
            select: {
              slug: true,
              permissions: {
                select: {
                  permission: {
                    select: {
                      resource: true,
                      action: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
});

export async function requireCustomer() {
  const session = await getCurrentSession();

  if (!session) redirect("/sign-in");

  const access = await getUserAccess(session.user.id);
  const isCustomer = access?.roles.some(
    ({ role }) => role.slug === "user",
  );
  const isInternal = access?.roles.some(
    ({ role }) => role.slug === "admin" || role.slug === "staff",
  );

  if (!access?.isActive || !isCustomer || isInternal) {
    redirect("/");
  }

  return session;
}

export async function requirePermission(resource: string, action: string) {
  const session = await getCurrentSession();

  if (!session) redirect("/admin/login");

  const access = await getUserAccess(session.user.id);
  const allowed = access?.roles.some(({ role }) =>
    role.permissions.some(
      ({ permission }) =>
        permission.resource === resource && permission.action === action,
    ),
  );

  if (!access?.isActive || !allowed) {
    redirect("/");
  }

  return session;
}