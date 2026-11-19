import type { EmailMessage } from "@/lib/email";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function emailLayout(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;color:#292524;max-width:560px;margin:auto;padding:32px"><p style="letter-spacing:.2em;font-size:12px">LUNECRAFT</p><h1 style="font-size:24px">${escapeHtml(title)}</h1>${body}<p style="font-size:12px;color:#78716c">LuneCraft Store Management</p></div>`;
}

export function createAdminInvitationEmail(input: {
  to: string; name: string; inviterName: string; roleNames: string[]; acceptUrl: string; expiresAt: Date;
}): EmailMessage {
  const { to, name, inviterName, roleNames, acceptUrl, expiresAt } = input;
  const roles = roleNames.map(escapeHtml).join(", ");
  const expiry = expiresAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
  return {
    to,
    subject: "You are invited to the LuneCraft team",
    html: emailLayout("Team invitation", `<p>Hello ${escapeHtml(name)},</p><p>${escapeHtml(inviterName)} invited you to join the LuneCraft admin team.</p><p><strong>Assigned roles:</strong> ${roles}</p><p><a href="${escapeHtml(acceptUrl)}" style="display:inline-block;background:#1c1917;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Accept invitation</a></p><p>This link expires on ${escapeHtml(expiry)}.</p><p style="font-size:12px;color:#78716c">If you did not expect this invitation, you can ignore this email.</p>`),
    text: `Hello ${name},\n\n${inviterName} invited you to join the LuneCraft admin team.\nAssigned roles: ${roleNames.join(", ")}\n\nAccept the invitation: ${acceptUrl}\nThis link expires on ${expiry}. If you did not expect this invitation, ignore this email.`,
  };
}

export function createAdminAccessRemovedEmail(input: { to: string; name: string }): EmailMessage {
  const text = `Hello ${input.name},\n\nYour administrative access to the LuneCraft store management system has been removed by an authorized administrator.\n\nYou can no longer access the LuneCraft Admin Dashboard.\n\nThis action does not necessarily delete your customer account.\n\nIf you believe this change was made in error, please contact the LuneCraft administrator.`;
  return {
    to: input.to,
    subject: "Your LuneCraft Admin Access Has Been Removed",
    html: emailLayout("Admin access removed", `<p>Hello ${escapeHtml(input.name)},</p><p>Your administrative access to the LuneCraft store management system has been removed by an authorized administrator.</p><p>You can no longer access the LuneCraft Admin Dashboard.</p><p>This action does not necessarily delete your customer account.</p><p>If you believe this change was made in error, please contact the LuneCraft administrator.</p>`),
    text,
  };
}

export function createVerificationEmail(input: { user: { name: string; email: string }; url: string }): EmailMessage {
  return {
    to: input.user.email,
    subject: "Verify your LuneCraft email address",
    html: emailLayout("Verify your email", `<p>Hello ${escapeHtml(input.user.name)},</p><p>Confirm your email address to continue setting up your account.</p><p><a href="${escapeHtml(input.url)}" style="display:inline-block;background:#1c1917;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Verify email</a></p>`),
    text: `Hello ${input.user.name},\n\nConfirm your email address to continue setting up your account: ${input.url}`,
  };
}

export function createPasswordResetEmail(input: { user: { name: string; email: string }; url: string }): EmailMessage {
  return {
    to: input.user.email,
    subject: "Reset your LuneCraft password",
    html: emailLayout("Reset your password", `<p>Hello ${escapeHtml(input.user.name)},</p><p>We received a request to reset your LuneCraft password.</p><p><a href="${escapeHtml(input.url)}" style="display:inline-block;background:#1c1917;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`),
    text: `Hello ${input.user.name},\n\nReset your LuneCraft password: ${input.url}\n\nIf you did not request this, ignore this email.`,
  };
}
