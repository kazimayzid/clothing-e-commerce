import "server-only";

type EmailMessage = { to: string; subject: string; html: string };

export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    readonly providerStatus?: number,
    readonly outcome: "FAILED" | "UNKNOWN" = "FAILED",
    readonly acceptedByProvider = false,
    readonly providerEmailId?: string,
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

function getSenderAddress() {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) return null;
  const bracketed = from.match(/<([^<>]+)>/);
  return (bracketed?.[1] ?? from).trim();
}

function senderConfigurationError() {
  const from = getSenderAddress();
  if (!from || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) {
    return "Email sender is missing or invalid. Set EMAIL_FROM to an address on a verified domain.";
  }
  const domain = from.split("@").at(-1)?.toLowerCase() ?? "";
  if (/yourverifieddomain|example\.|placeholder|\.test$/.test(domain)) {
    return "EMAIL_FROM still uses a placeholder domain. Configure a sender on a verified Resend domain.";
  }
  return null;
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && !senderConfigurationError());
}

export function getInvitationBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BETTER_AUTH_URL;
  const isProduction = process.env.NODE_ENV === "production";
  const value = configured ?? (isProduction ? "" : "http://localhost:3000");
  if (!value) {
    throw new EmailDeliveryError("Invitation base URL is missing. Set NEXT_PUBLIC_BASE_URL to the public app origin.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new EmailDeliveryError("Invitation base URL is invalid. Check NEXT_PUBLIC_BASE_URL.");
  }

  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (isProduction && (isLocal || url.protocol !== "https:")) {
    throw new EmailDeliveryError("Production invitation links must use the public HTTPS application URL.");
  }
  return url.origin;
}

export async function sendTransactionalEmail(message: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new EmailDeliveryError("RESEND_API_KEY is missing. Configure the Resend API key before sending email.");
  }
  const senderError = senderConfigurationError();
  if (senderError) throw new EmailDeliveryError(senderError);

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [message.to], subject: message.subject, html: message.html }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    throw new EmailDeliveryError(
      timeout ? "Resend did not respond before the request timed out; provider acceptance is unknown." : "Could not connect to Resend; provider acceptance is unknown.",
      undefined,
      "UNKNOWN",
    );
  }

  if (!response.ok) {
    const safeMessage = response.status === 401
      ? "Resend rejected the API key. Replace RESEND_API_KEY with a valid key."
      : response.status === 403
        ? "Resend denied the API key or sender. Check key permissions and verify the EMAIL_FROM domain."
        : response.status === 422
          ? "Resend rejected the sender or email content. Check EMAIL_FROM and the invitation template."
          : response.status === 429
            ? "Resend rate limit reached. Wait before retrying the invitation."
            : `Resend rejected the email request (HTTP ${response.status}).`;
    throw new EmailDeliveryError(safeMessage, response.status);
  }

  const payload = await response.json().catch(() => null) as { id?: unknown } | null;
  if (typeof payload?.id !== "string" || payload.id.length === 0) {
    throw new EmailDeliveryError("Resend returned success without an email ID; provider acceptance cannot be confirmed.", response.status, "UNKNOWN", true);
  }
  return { id: payload.id };
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export async function sendAdminInvitationEmail(input: {
  to: string; name: string; inviterName: string; roleNames: string[]; acceptUrl: string; expiresAt: Date;
}) {
  const { to, name, inviterName, roleNames, acceptUrl, expiresAt } = input;
  const roles = roleNames.map(escapeHtml).join(", ");
  return sendTransactionalEmail({
    to,
    subject: "You are invited to the LuneCraft team",
    html: `<div style="font-family:Arial,sans-serif;color:#292524;max-width:560px;margin:auto;padding:32px"><p style="letter-spacing:.2em;font-size:12px">LUNECRAFT</p><h1 style="font-size:24px">Team invitation</h1><p>Hello ${escapeHtml(name)},</p><p>${escapeHtml(inviterName)} invited you to join the LuneCraft admin team.</p><p><strong>Assigned roles:</strong> ${roles}</p><p><a href="${escapeHtml(acceptUrl)}" style="display:inline-block;background:#1c1917;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Accept invitation</a></p><p>This link expires on ${escapeHtml(expiresAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }))} UTC.</p><p style="font-size:12px;color:#78716c">If you did not expect this invitation, you can ignore this email.</p></div>`,
  });
}

export async function sendVerificationEmail(input: { user: { name: string; email: string }; url: string }) {
  await sendTransactionalEmail({
    to: input.user.email,
    subject: "Verify your LuneCraft email address",
    html: `<div style="font-family:Arial,sans-serif;color:#292524;max-width:560px;margin:auto;padding:32px"><p style="letter-spacing:.2em;font-size:12px">LUNECRAFT</p><h1 style="font-size:24px">Verify your email</h1><p>Hello ${escapeHtml(input.user.name)},</p><p>Confirm your email address to continue setting up your account.</p><p><a href="${escapeHtml(input.url)}" style="display:inline-block;background:#1c1917;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Verify email</a></p></div>`,
  });
}
