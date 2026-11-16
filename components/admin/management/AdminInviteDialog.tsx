"use client";

import { useState } from "react";
import { MailPlus } from "lucide-react";

import AdminDialog from "@/components/admin/management/AdminDialog";
import type { AdminRoleSummary } from "@/components/admin/management/management-types";

export default function AdminInviteDialog({
  roles,
  onClose,
}: {
  roles: AdminRoleSummary[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const assignableRoles = roles.filter(
    ({ slug }) => slug !== "admin" && slug !== "user",
  );

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  }

  return (
    <AdminDialog
      title="Invite admin or staff"
      description="Choose from existing database roles. The invitation workflow is not configured yet."
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={(event) => event.preventDefault()} className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-stone-700">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
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

        <label className="block text-xs font-medium text-stone-700">
          Invitation message <span className="font-normal text-stone-400">(optional)</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            maxLength={500}
            className="mt-2 w-full resize-y rounded-md border border-stone-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-stone-500"
            placeholder="Add a short note for the invitee."
          />
        </label>

        <div className="flex items-start gap-3 rounded-md border border-stone-200 bg-stone-50 p-3.5">
          <MailPlus className="mt-0.5 size-4 shrink-0 text-stone-500" />
          <p className="text-[11px] leading-5 text-stone-600">
            Better Auth is configured for sign-in and public customer sign-up, but this project has no invitation endpoint or email delivery flow. No account or email will be created from this preview.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-stone-400">Account status: invitation flow unavailable</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-stone-200 px-3.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              Close
            </button>
            <button
              type="button"
              disabled
              className="h-9 cursor-not-allowed rounded-md bg-stone-300 px-4 text-xs font-medium text-white"
              title="Invitation workflow is not configured"
            >
              Send Invitation
            </button>
          </div>
        </div>
      </form>
    </AdminDialog>
  );
}
