import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailReceipt = {
  id: string;
  response: string;
};

export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    readonly providerStatus?: number,
    readonly outcome: "FAILED" | "UNKNOWN" = "FAILED",
    readonly acceptedByProvider = false,
    readonly providerEmailId?: string,
    readonly providerResponse?: string,
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

let cachedTransporter: Transporter | undefined;
let cachedConfigKey: string | undefined;

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const portText = process.env.SMTP_PORT?.trim();
  const secureText = process.env.SMTP_SECURE?.trim().toLowerCase();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM?.trim();
  const fromAddress = getAddress(from);
  const port = Number(portText);

  if (
    !host ||
    !portText ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !["true", "false"].includes(secureText ?? "") ||
    !user ||
    !pass ||
    !from ||
    !fromAddress ||
    !isEmailAddress(user) ||
    !isEmailAddress(fromAddress) ||
    user.toLowerCase() !== fromAddress.toLowerCase()
  ) {
    return null;
  }

  return { host, port, secure: secureText === "true", user, pass, from };
}

function getAddress(value?: string) {
  if (!value) return null;
  const bracketed = value.match(/<([^<>]+)>/);
  return (bracketed?.[1] ?? value).trim();
}

function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getEmailConfigurationError() {
  const values = [
    process.env.SMTP_HOST?.trim(),
    process.env.SMTP_PORT?.trim(),
    process.env.SMTP_SECURE?.trim().toLowerCase(),
    process.env.SMTP_USER?.trim(),
    process.env.SMTP_PASS,
    process.env.EMAIL_FROM?.trim(),
  ];
  if (values.some((value) => !value)) {
    return "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, and EMAIL_FROM.";
  }
  if (!getSmtpConfig()) {
    return "SMTP configuration is invalid. Check the host, port, secure setting, and ensure EMAIL_FROM matches SMTP_USER.";
  }
  return null;
}

export function isEmailConfigured() {
  return getSmtpConfig() !== null;
}

export function getInvitationBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BETTER_AUTH_URL;
  const isProduction = process.env.NODE_ENV === "production";
  const value = configured ?? (isProduction ? "" : "http://localhost:3000");
  if (!value) throw new EmailDeliveryError("Invitation base URL is missing. Set NEXT_PUBLIC_BASE_URL to the public app origin.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new EmailDeliveryError("Invitation base URL is invalid. Check NEXT_PUBLIC_BASE_URL.");
  }
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (isProduction && (localHost || url.protocol !== "https:")) {
    throw new EmailDeliveryError("Production invitation links must use the public HTTPS application URL.");
  }
  return url.origin;
}

function createTransporter() {
  const config = getSmtpConfig();
  if (!config) {
    throw new EmailDeliveryError(
      getEmailConfigurationError() ?? "SMTP configuration is invalid.",
    );
  }

  const key = [config.host, config.port, config.secure, config.user, config.pass].join("\u0000");
  if (!cachedTransporter || cachedConfigKey !== key) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    cachedConfigKey = key;
  }
  return { transporter: cachedTransporter, config };
}

function mapTransportError(error: unknown) {
  const candidate = error as { code?: string; responseCode?: number; response?: string } | null;
  const code = candidate?.code;
  const responseCode = candidate?.responseCode;
  const providerResponse = typeof candidate?.response === "string"
    ? candidate.response.replace(/[\r\n]+/g, " ").slice(0, 1000)
    : undefined;
  if (code === "EAUTH") {
    return new EmailDeliveryError("SMTP authentication failed. Check SMTP_USER and the Gmail app password.", responseCode, "FAILED", false, undefined, providerResponse);
  }
  if (code === "EENVELOPE" || (responseCode && responseCode >= 500 && responseCode < 600)) {
    return new EmailDeliveryError("SMTP rejected the sender or recipient. Check the email address and Gmail sender settings.", responseCode, "FAILED", false, undefined, providerResponse);
  }
  if (["ETIMEDOUT", "ESOCKET", "ECONNECTION", "ECONNRESET"].includes(code ?? "")) {
    return new EmailDeliveryError("SMTP connection timed out or closed; message acceptance is unknown.", responseCode, "UNKNOWN", false, undefined, providerResponse);
  }
  return new EmailDeliveryError("SMTP could not confirm the email request. Check the server email logs.", responseCode, "UNKNOWN", false, undefined, providerResponse);
}

export async function verifyEmailTransport() {
  const { transporter } = createTransporter();
  try {
    await transporter.verify();
    return { verified: true as const };
  } catch (error) {
    throw mapTransportError(error);
  }
}

export async function sendTransactionalEmail(message: EmailMessage): Promise<EmailReceipt> {
  const { transporter, config } = createTransporter();
  try {
    const info = await transporter.sendMail({
      from: config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    const response = String(info.response ?? "").slice(0, 1000);
    if (info.rejected?.length || !info.accepted?.length) {
      throw new EmailDeliveryError(
        "SMTP rejected the recipient. Check the invited email address and retry.",
        undefined,
        "FAILED",
        false,
        undefined,
        response,
      );
    }
    if (typeof info.messageId !== "string" || !info.messageId) {
      throw new EmailDeliveryError(
        "SMTP accepted the request but did not return a message ID; delivery is unconfirmed.",
        undefined,
        "UNKNOWN",
        true,
        undefined,
        response,
      );
    }
    return { id: info.messageId, response };
  } catch (error) {
    if (error instanceof EmailDeliveryError) throw error;
    throw mapTransportError(error);
  }
}
