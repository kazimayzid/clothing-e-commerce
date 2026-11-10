import { getCurrentSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

import UserButtonClient from "@/components/shared/UserButtonClient";

export default async function UserButton() {
  const session = await getCurrentSession();

  if (!session) {
    return <UserButtonClient />;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
  });

  const roleSlugs = user?.roles.map(({ role }) => role.slug) ?? [];
  const hasCustomerRole = roleSlugs.includes("user");
  const hasInternalRole = roleSlugs.includes("admin") || roleSlugs.includes("staff");

  const customerName =
    user?.isActive && hasCustomerRole && !hasInternalRole
      ? user.name || session.user.name
      : undefined;

  return <UserButtonClient customerName={customerName} />;
}
