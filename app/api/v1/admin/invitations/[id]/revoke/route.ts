import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";

export async function POST(_request: Request, { params }: RouteContext<"/api/v1/admin/invitations/[id]/revoke">) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  const result = await prisma.adminInvitation.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
  if (result.count !== 1) return NextResponse.json({ error: "This invitation is no longer pending." }, { status: 409 });
  return NextResponse.json({ revoked: true });
}
