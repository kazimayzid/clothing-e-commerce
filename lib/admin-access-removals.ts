import "server-only";

import { prisma } from "@/lib/prisma";
import { EmailDeliveryError, sendTransactionalEmail } from "@/lib/email";
import { createAdminAccessRemovedEmail } from "@/lib/email-templates";

export async function sendAccessRemovalNotification(id: string) {
  const claim = await prisma.adminAccessRemoval.updateMany({
    where: {
      id,
      OR: [
        { emailStatus: { in: ["NOT_ATTEMPTED", "FAILED", "UNKNOWN"] } },
        { emailStatus: "SENDING", emailAttemptedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
      ],
    },
    data: {
      emailStatus: "SENDING",
      emailAttemptedAt: new Date(),
      lastEmailError: null,
      providerEmailId: null,
      providerResponse: null,
    },
  });
  if (claim.count !== 1) return false;

  const removal = await prisma.adminAccessRemoval.findUniqueOrThrow({ where: { id } });
  let receipt: Awaited<ReturnType<typeof sendTransactionalEmail>> | undefined;
  try {
    receipt = await sendTransactionalEmail(createAdminAccessRemovedEmail({
      to: removal.recipientEmail,
      name: removal.recipientName,
    }));
    await prisma.adminAccessRemoval.update({
      where: { id },
      data: {
        emailStatus: "ACCEPTED_BY_PROVIDER",
        providerEmailId: receipt.id,
        providerResponse: receipt.response,
        lastEmailError: null,
      },
    });
  } catch (error) {
    const deliveryError = receipt
      ? new EmailDeliveryError("SMTP accepted the notification, but its receipt could not be saved. Check the message ID before retrying.", undefined, "UNKNOWN", true, receipt.id, receipt.response)
      : error instanceof EmailDeliveryError
        ? error
        : new EmailDeliveryError("Unexpected notification email error. Check server logs.", undefined, "UNKNOWN");
    await prisma.adminAccessRemoval.update({
      where: { id },
      data: {
        emailStatus: deliveryError.outcome,
        providerEmailId: deliveryError.providerEmailId ?? null,
        providerResponse: deliveryError.providerResponse ?? null,
        lastEmailError: deliveryError.message,
      },
    });
  }
  return true;
}

export function serializeAccessRemoval(removal: {
  id: string;
  recipientEmail: string;
  recipientName: string;
  removedRoles: unknown;
  emailStatus: string;
  providerEmailId: string | null;
  emailAttemptedAt: Date | null;
  lastEmailError: string | null;
  createdAt: Date;
}) {
  return {
    id: removal.id,
    recipientEmail: removal.recipientEmail,
    recipientName: removal.recipientName,
    removedRoles: Array.isArray(removal.removedRoles)
      ? removal.removedRoles.flatMap((role) => {
          if (!role || typeof role !== "object") return [];
          const item = role as { id?: unknown; name?: unknown };
          return typeof item.id === "string" && typeof item.name === "string"
            ? [{ id: item.id, name: item.name }]
            : [];
        })
      : [],
    emailStatus: removal.emailStatus,
    providerEmailId: removal.providerEmailId,
    emailAttemptedAt: removal.emailAttemptedAt?.toISOString() ?? null,
    lastEmailError: removal.lastEmailError,
    createdAt: removal.createdAt.toISOString(),
  };
}
