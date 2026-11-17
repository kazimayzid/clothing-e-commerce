import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApiPermission("users:revoke_sessions");
  if (access.response) return access.response;
  const { id } = await params;
  const user = await prisma.user.findFirst({ where: { id, roles: { some: { role: { scope: "ADMIN" } } } }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Admin or Staff account not found." }, { status: 404 });
  const result = await prisma.session.deleteMany({ where: { userId: id } });
  return NextResponse.json({ revoked: result.count });
}
