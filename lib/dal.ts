import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminAccessContext, hasPermission } from "@/lib/admin-access";


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

const getCustomerAccess = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      roles: {
        select: {
          role: { select: { scope: true } },
        },
      },
    },
  });
});

export async function requireCustomer() {
  const session = await getCurrentSession();

  if (!session) redirect("/sign-in");

  const access = await getCustomerAccess(session.user.id);
  const isCustomer = access?.roles.some(({ role }) => role.scope === "CUSTOMER");
  const isInternal = access?.roles.some(({ role }) => role.scope === "ADMIN");

  if (!access?.isActive || !isCustomer || isInternal) {
    redirect("/");
  }

  return session;
}

export async function requirePermission(resource: string, action: string) {
  const session = await getCurrentSession();

  if (!session) redirect("/admin/sign-in");

  const access = await getAdminAccessContext(session.user.id);
  const isInternal = Boolean(access?.roles.length);
  const allowed = access && hasPermission(access, `${resource}:${action}`);

  if (!access?.isActive || !isInternal) {
    redirect("/admin/sign-in");
  }

  if (!allowed) {
    redirect("/");
  }

  return session;
}
