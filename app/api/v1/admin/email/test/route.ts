import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { EmailDeliveryError, getEmailConfigurationError, verifyEmailTransport } from "@/lib/email";

export const runtime = "nodejs";

export async function POST() {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const configError = getEmailConfigurationError();
  if (configError) return NextResponse.json({ verified: false, error: configError }, { status: 503 });

  try {
    await verifyEmailTransport();
    return NextResponse.json({ verified: true, message: "SMTP connection and authentication verified. No email was sent." });
  } catch (error) {
    const message = error instanceof EmailDeliveryError ? error.message : "SMTP connection test failed. Check server configuration.";
    return NextResponse.json({ verified: false, error: message }, { status: 502 });
  }
}
