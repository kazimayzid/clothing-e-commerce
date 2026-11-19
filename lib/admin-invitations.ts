import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { EmailDeliveryError, getInvitationBaseUrl, sendTransactionalEmail, type EmailReceipt } from "@/lib/email";
import { createAdminInvitationEmail } from "@/lib/email-templates";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const hashInvitationToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const createInvitationToken = () => randomBytes(32).toString("base64url");
export const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export function invitationUrl(token: string) {
  const url = new URL("/admin/invitations/accept", getInvitationBaseUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendInvitation(id: string, token: string) {
  const invitation = await prisma.adminInvitation.findUniqueOrThrow({
    where: { id },
    include: { invitedBy: { select: { name: true } }, roles: { include: { role: { select: { name: true } } } } },
  });
  await prisma.adminInvitation.update({
    where: { id },
    data: {
      emailProvider: "SMTP",
      emailStatus: "SENDING",
      emailAttemptedAt: new Date(),
      providerEmailId: null,
      providerResponse: null,
      lastEmailError: null,
      sentAt: null,
    },
  });

  let receipt: EmailReceipt;
  try {
    receipt = await sendTransactionalEmail(createAdminInvitationEmail({
      to: invitation.email,
      name: invitation.name,
      inviterName: invitation.invitedBy.name,
      roleNames: invitation.roles.map(({ role }) => role.name),
      acceptUrl: invitationUrl(token),
      expiresAt: invitation.expiresAt,
    }));
  } catch (error) {
    const deliveryError = error instanceof EmailDeliveryError
      ? error
      : new EmailDeliveryError(
          "Unexpected email delivery error. Check server logs and invitation status.",
          undefined,
          "UNKNOWN",
        );
    await prisma.adminInvitation.update({
      where: { id },
      data: {
        emailStatus: deliveryError.outcome,
        lastEmailError: deliveryError.message,
        providerEmailId: deliveryError.providerEmailId ?? null,
        providerResponse: deliveryError.providerResponse ?? null,
        sentAt: null,
      },
    });
    throw deliveryError;
  }

  const sentAt = new Date();
  try {
    await prisma.adminInvitation.update({
      where: { id },
      data: {
        emailStatus: "ACCEPTED_BY_PROVIDER",
        providerEmailId: receipt.id,
        providerResponse: receipt.response,
        lastEmailError: null,
        sentAt,
      },
    });
  } catch {
    throw new EmailDeliveryError(
      "The SMTP server accepted the request, but the app could not save its message ID. Check the mail server logs before retrying.",
      undefined,
      "UNKNOWN",
      true,
      receipt.id,
      receipt.response,
    );
  }
  return { providerEmailId: receipt.id, providerAcceptedAt: sentAt };
}

export function serializeInvitation(invitation: {
  id: string; email: string; name: string; status: string; expiresAt: Date; sentAt: Date | null;
  acceptedAt: Date | null; revokedAt: Date | null; createdAt: Date;
  roles: { role: { id: string; name: string; slug: string } }[];
}) {
  const status = invitation.status === "PENDING" && invitation.expiresAt <= new Date()
    ? "EXPIRED"
    : invitation.status;
  return {
    id: invitation.id,
    email: invitation.email,
    name: invitation.name,
    status,
    expiresAt: invitation.expiresAt.toISOString(),
    sentAt: invitation.sentAt?.toISOString() ?? null,
    acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
    revokedAt: invitation.revokedAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString(),
    roles: invitation.roles.map(({ role }) => role),
  };
}

export function serializeManagedInvitation(invitation: {
  id: string; email: string; name: string; status: string; expiresAt: Date; sentAt: Date | null;
  acceptedAt: Date | null; revokedAt: Date | null; createdAt: Date; emailStatus: string;
  emailProvider: string; providerEmailId: string | null; emailAttemptedAt: Date | null; lastEmailError: string | null;
  roles: { role: { id: string; name: string; slug: string } }[];
}) {
  return {
    ...serializeInvitation(invitation),
    emailStatus: invitation.emailStatus,
    emailProvider: invitation.emailProvider,
    providerEmailId: invitation.providerEmailId,
    emailAttemptedAt: invitation.emailAttemptedAt?.toISOString() ?? null,
    lastEmailError: invitation.lastEmailError,
  };
}
