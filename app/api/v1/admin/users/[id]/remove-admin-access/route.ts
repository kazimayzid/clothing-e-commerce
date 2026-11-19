import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { sendAccessRemovalNotification, serializeAccessRemoval } from "@/lib/admin-access-removals";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: RouteContext<"/api/v1/admin/users/[id]/remove-admin-access">) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (id === access.context.userId) {
    return NextResponse.json({ error: "You cannot remove your own Admin access." }, { status: 403 });
  }

  let removalId: string;
  try {
    const removal = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          roles: {
            where: { role: { scope: "ADMIN" } },
            select: { role: { select: { id: true, name: true, isSuperAdmin: true } } },
          },
        },
      });
      if (!target || target.roles.length === 0) return null;
      if (target.roles.some(({ role }) => role.isSuperAdmin)) throw new Error("PROTECTED_SUPER_ADMIN");

      const removedRoles = target.roles.map(({ role }) => ({ id: role.id, name: role.name }));
      await tx.userRole.deleteMany({ where: { userId: id, role: { scope: "ADMIN" } } });
      await tx.session.deleteMany({ where: { userId: id } });
      return tx.adminAccessRemoval.create({
        data: {
          userId: target.id,
          removedById: access.context.userId,
          recipientEmail: target.email,
          recipientName: target.name,
          removedRoles,
        },
        select: { id: true },
      });
    }, { isolationLevel: "Serializable" });

    if (!removal) return NextResponse.json({ error: "Admin or Staff account not found." }, { status: 404 });
    removalId = removal.id;
  } catch (error) {
    if (error instanceof Error && error.message === "PROTECTED_SUPER_ADMIN") {
      return NextResponse.json({ error: "Protected Super Admin access cannot be removed." }, { status: 403 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "Admin access changed concurrently. Reload and try again." }, { status: 409 });
    }
    throw error;
  }

  await sendAccessRemovalNotification(removalId);
  const removal = await prisma.adminAccessRemoval.findUniqueOrThrow({ where: { id: removalId } });
  return NextResponse.json({
    removed: true,
    removal: serializeAccessRemoval(removal),
    emailAcceptedByProvider: removal.emailStatus === "ACCEPTED_BY_PROVIDER",
  });
}
