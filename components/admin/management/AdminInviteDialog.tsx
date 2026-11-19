"use client";

import { useState, type FormEvent } from "react";
import { MailPlus } from "lucide-react";
import { toast } from "sonner";

import AdminDialog from "@/components/admin/management/AdminDialog";
import type { AdminInvitationSummary, AdminRoleSummary } from "@/components/admin/management/management-types";

export default function AdminInviteDialog({
  roles,
  onClose,
  onCreated,
}: {
  roles: AdminRoleSummary[];
  onClose: () => void;
  onCreated: (invitation: AdminInvitationSummary) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const assignableRoles = roles.filter(
    ({ isSuperAdmin, scope }) => scope === "ADMIN" && !isSuperAdmin,
  );

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, roleIds: selectedRoleIds }),
      });
      const data = await response.json();
      if (data.invitation) onCreated(data.invitation);
      if (data.invitation && !data.emailAcceptedByProvider) {
        const deliveryMessage = data.error || "Invitation saved, but the SMTP server did not accept the email request. Retry after fixing the configuration.";
        toast.error(deliveryMessage);
        onClose();
        return;
      }
      if (!response.ok) throw new Error(data.error || "Unable to send invitation.");
      if (data.deliveryStatus === "UNCONFIRMED") {
        toast.success("SMTP server accepted the invitation; inbox delivery is not confirmed yet.");
        onClose();
        return;
      }
      toast.success("SMTP server accepted the invitation; inbox delivery is not confirmed yet.");
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to send invitation.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminDialog
      title="Invite admin or staff"
      description="Invite a teammate using existing ADMIN-scoped roles. The invite expires in seven days."
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-stone-700">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={200}
              autoComplete="name"
              className="mt-2 h-10 w-full rounded-md border border-stone-200 px-3 text-sm font-normal outline-none focus:border-stone-500"
              placeholder="Team member name"
            />
          </label>
          <label className="text-xs font-medium text-stone-700">
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-2 h-10 w-full rounded-md border border-stone-200 px-3 text-sm font-normal outline-none focus:border-stone-500"
              placeholder="name@example.com"
              required
              maxLength={320}
            />
          </label>
        </div>

        <fieldset>
          <legend className="text-xs font-medium text-stone-700">
            Assign roles <span className="font-normal text-stone-400">(select one or more)</span>
          </legend>
          {assignableRoles.length ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {assignableRoles.map((role) => (
                <label
                  key={role.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                    selectedRoleIds.includes(role.id)
                      ? "border-stone-500 bg-stone-50"
                      : "border-stone-200 hover:bg-stone-50/70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="mt-0.5 size-4 accent-stone-900"
                  />
                  <span>
                    <span className="block text-xs font-medium text-stone-800">{role.name}</span>
                    <span className="mt-1 block text-[10px] text-stone-500">
                      {role.description || role.slug}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-md border border-dashed border-stone-200 p-4 text-xs text-stone-500">
              No assignable staff or custom roles exist yet. The protected Admin role is intentionally excluded.
            </p>
          )}
          <p className="mt-2 text-[10px] text-stone-400">
            The seeded full-access Admin role cannot be assigned from this form.
          </p>
        </fieldset>

        <div className="flex items-start gap-3 rounded-md border border-stone-200 bg-stone-50 p-3.5">
          <MailPlus className="mt-0.5 size-4 shrink-0 text-stone-500" />
          <p className="text-[11px] leading-5 text-stone-600">
            The recipient creates or uses an account through Better Auth. The invitation link confirms a newly created staff account; an account that existed before the invitation must have verified email. Delivery uses configured SMTP.
          </p>
        </div>

        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-stone-400">Only the protected Super Admin can send invitations.</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-stone-200 px-3.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim() || selectedRoleIds.length === 0}
              className="h-9 rounded-md bg-stone-900 px-4 text-xs font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {loading ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </div>
      </form>
    </AdminDialog>
  );
}
