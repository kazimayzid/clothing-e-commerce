import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";

export async function POST(_request: Request, { params }: RouteContext<"/api/v1/admin/invitations/[id]/revoke">) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  const result = await prisma.$transaction(async (tx) => {
    const invite = await tx.adminInvitation.findFirst({ where: { id, status: "PENDING" }, select: { id: true, name: true, email: true, status: true } });
    if (!invite) return 0;
    const updated = await tx.adminInvitation.updateMany({ where: { id, status: "PENDING" }, data: { status: "REVOKED", revokedAt: new Date() } });
    if (updated.count === 1) await appendAdminAuditLog(tx, {
      actor: access.context, request: _request, action: "invitation.revoked", category: "INVITATION", riskLevel: "MEDIUM",
      description: `Revoked invitation for ${invite.email}.`, targetType: "INVITATION", targetId: invite.id, targetName: invite.name, targetEmail: invite.email,
      beforeState: { status: invite.status }, afterState: { status: "REVOKED" },
    });
    return updated.count;
  });
  if (result !== 1) return NextResponse.json({ error: "This invitation is no longer pending." }, { status: 409 });
  return NextResponse.json({ revoked: true });
}
