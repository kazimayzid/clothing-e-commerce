import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { EmailDeliveryError, getEmailConfigurationError, verifyEmailTransport } from "@/lib/email";
import { appendAdminAuditLog } from "@/lib/admin-audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const configError = getEmailConfigurationError();
  if (configError) return NextResponse.json({ verified: false, error: configError }, { status: 503 });

  try {
    await verifyEmailTransport();
    await appendAdminAuditLog(prisma, {
      actor: access.context, request, action: "email.transport_verified", category: "SYSTEM", riskLevel: "MEDIUM",
      description: "Verified the configured SMTP connection and authentication without sending an email.", targetType: "EMAIL_CONFIGURATION", afterState: { verified: true },
    });
    return NextResponse.json({ verified: true, message: "SMTP connection and authentication verified. No email was sent." });
  } catch (error) {
    const message = error instanceof EmailDeliveryError ? error.message : "SMTP connection test failed. Check server configuration.";
    try {
      await appendAdminAuditLog(prisma, {
        actor: access.context, request, action: "email.transport_verification_failed", category: "SYSTEM", riskLevel: "MEDIUM",
        description: "SMTP connection verification failed.", targetType: "EMAIL_CONFIGURATION", success: false, failureCode: "SMTP_VERIFICATION_FAILED",
      });
    } catch (auditError) {
      console.error("Failed to record SMTP verification failure", auditError);
    }
    return NextResponse.json({ verified: false, error: message }, { status: 502 });
  }
}
