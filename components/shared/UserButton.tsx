import { cache } from "react";
import { getCurrentSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import UserButtonClient from "@/components/shared/UserButtonClient";

type Props = {
  variant?: "desktop" | "mobile";
};

const getNavbarUser = cache(async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      isActive: true,
      roles: {
        select: {
          role: {
            select: { slug: true },
          },
        },
      },
    },
  }),
);

export default async function UserButton({ variant = "desktop" }: Props) {
  const session = await getCurrentSession();

  if (!session) {
    return <UserButtonClient variant={variant} />;
  }

  const user = await getNavbarUser(session.user.id);

  const roleSlugs = user?.roles.map(({ role }) => role.slug) ?? [];
  const hasCustomerRole = roleSlugs.includes("user");
  const hasInternalRole = roleSlugs.includes("admin") || roleSlugs.includes("staff");

  const customerName =
    user?.isActive && hasCustomerRole && !hasInternalRole
      ? user.name || session.user.name
      : undefined;

  return <UserButtonClient customerName={customerName} variant={variant} />;
}
