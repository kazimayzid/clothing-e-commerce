import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashInvitationToken, serializeInvitation } from "@/lib/admin-invitations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = z.string().min(32).max(100).safeParse(new URL(request.url).searchParams.get("token"));
  if (!token.success) return NextResponse.json({ error: "Invitation is invalid or no longer available." }, { status: 404 });
  const invitation = await prisma.adminInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token.data) },
    include: { roles: { include: { role: { select: { id: true, name: true, slug: true } } } } },
  });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date()) {
    if (invitation?.status === "PENDING") await prisma.adminInvitation.updateMany({ where: { id: invitation.id, status: "PENDING", expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Invitation is invalid or no longer available." }, { status: 404 });
  }
  return NextResponse.json({ invitation: serializeInvitation(invitation) }, { headers: { "Cache-Control": "no-store" } });
}
