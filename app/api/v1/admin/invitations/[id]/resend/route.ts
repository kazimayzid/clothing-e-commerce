import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { EmailDeliveryError } from "@/lib/email";
import {
  createInvitationToken,
  hashInvitationToken,
  INVITATION_LIFETIME_MS,
  sendInvitation,
  serializeManagedInvitation,
} from "@/lib/admin-invitations";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/v1/admin/invitations/[id]/resend">,
) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  const now = new Date();
  const current = await prisma.adminInvitation.findFirst({
    where: { id, status: "PENDING", expiresAt: { gt: now } },
    select: { id: true, name: true, email: true, tokenHash: true, expiresAt: true, status: true },
  });
  if (!current) {
    return NextResponse.json(
      { error: "This invitation is no longer pending. Create a new invitation if needed." },
      { status: 409 },
    );
  }

  const token = createInvitationToken();
  const updated = await prisma.adminInvitation.updateMany({
    where: { id, tokenHash: current.tokenHash, status: "PENDING", expiresAt: { gt: now } },
    data: {
      tokenHash: hashInvitationToken(token),
      expiresAt: new Date(now.getTime() + INVITATION_LIFETIME_MS),
      sentAt: null,
      emailProvider: "SMTP",
      emailStatus: "NOT_ATTEMPTED",
      providerEmailId: null,
      providerResponse: null,
      emailAttemptedAt: null,
      lastEmailError: null,
    },
  });
  if (updated.count !== 1) {
    return NextResponse.json(
      { error: "This invitation is no longer pending. Create a new invitation if needed." },
      { status: 409 },
    );
  }
  await prisma.$transaction(async (tx) => {
    await appendAdminAuditLog(tx, {
      actor: access.context, request, action: "invitation.resent", category: "INVITATION", riskLevel: "MEDIUM",
      description: `Generated and sent a replacement invitation link to ${current.email}.`, targetType: "INVITATION", targetId: current.id, targetName: current.name, targetEmail: current.email,
      beforeState: { status: current.status, expiresAt: current.expiresAt.toISOString() }, afterState: { status: "PENDING", expiresAt: new Date(now.getTime() + INVITATION_LIFETIME_MS).toISOString() },
    });
  });

  try {
    await sendInvitation(id, token);
  } catch (error) {
    console.error("Admin invitation resend failed", {
      providerStatus: error instanceof EmailDeliveryError ? error.providerStatus : undefined,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    const invitation = await prisma.adminInvitation.findUniqueOrThrow({
      where: { id },
      include: { roles: { include: { role: { select: { id: true, name: true, slug: true } } } } },
    });
    return NextResponse.json(
      {
        invitation: serializeManagedInvitation(invitation),
        emailAcceptedByProvider: error instanceof EmailDeliveryError
          ? error.acceptedByProvider
          : invitation.emailStatus === "ACCEPTED_BY_PROVIDER",
        providerEmailId: error instanceof EmailDeliveryError
          ? error.providerEmailId ?? invitation.providerEmailId
          : invitation.providerEmailId,
        deliveryStatus: "UNCONFIRMED",
        error: invitation.lastEmailError ?? "Email state could not be confirmed. Check the invitation status before retrying.",
      },
      { status: 502 },
    );
  }

  const invitation = await prisma.adminInvitation.findUniqueOrThrow({
    where: { id },
    include: { roles: { include: { role: { select: { id: true, name: true, slug: true } } } } },
  });
  return NextResponse.json({
    invitation: serializeManagedInvitation(invitation),
    emailAcceptedByProvider: true,
    deliveryStatus: "UNCONFIRMED",
  });
}
