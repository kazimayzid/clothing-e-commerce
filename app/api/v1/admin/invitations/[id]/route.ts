import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { serializeManagedInvitation } from "@/lib/admin-invitations";

export async function GET(_request: Request, { params }: RouteContext<"/api/v1/admin/invitations/[id]">) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  const invitation = await prisma.adminInvitation.findUnique({
    where: { id },
    include: { roles: { include: { role: { select: { id: true, name: true, slug: true } } } } },
  });
  if (!invitation) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  return NextResponse.json({ invitation: serializeManagedInvitation(invitation) });
}
