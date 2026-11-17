import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";

const schema = z.object({ isActive: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApiPermission("users:deactivate");
  if (access.response) return access.response;
  const { id } = await params;
  if (id === access.context.userId) return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Account status is invalid." }, { status: 400 });

  try {
    const user = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({
        where: { id, roles: { some: { role: { scope: "ADMIN" } } } },
        select: { id: true, isActive: true, roles: { select: { role: { select: { isSuperAdmin: true } } } } },
      });
      if (!target) return null;
      if (!parsed.data.isActive && target.isActive && target.roles.some(({ role }) => role.isSuperAdmin)) {
        const activeSuperAdmins = await tx.user.count({ where: { isActive: true, roles: { some: { role: { isSuperAdmin: true } } } } });
        if (activeSuperAdmins <= 1) throw new Error("LAST_ACTIVE_SUPER_ADMIN");
      }
      const updated = await tx.user.update({ where: { id }, data: { isActive: parsed.data.isActive }, select: { id: true, isActive: true } });
      if (!parsed.data.isActive) await tx.session.deleteMany({ where: { userId: id } });
      return updated;
    }, { isolationLevel: "Serializable" });
    if (!user) return NextResponse.json({ error: "Admin or Staff account not found." }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ACTIVE_SUPER_ADMIN") return NextResponse.json({ error: "The last active Super Admin cannot be deactivated." }, { status: 409 });
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") return NextResponse.json({ error: "Account security state changed concurrently. Reload and try again." }, { status: 409 });
    throw error;
  }
}
