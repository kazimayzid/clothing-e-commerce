"use client";

import { useState } from "react";

import AdminDialog from "@/components/admin/management/AdminDialog";
import type {
  AdminRoleSummary,
  ManagedAdminUser,
} from "@/components/admin/management/management-types";
import { getPermissionRisk } from "@/lib/admin-permission-risk";

type Props = {
  user: ManagedAdminUser;
  roles: AdminRoleSummary[];
  currentUserId: string;
  onClose: () => void;
  onSave: (roleIds: string[]) => Promise<void>;
};

export default function AdminRoleAssignmentDialog({
  user,
  roles,
  currentUserId,
  onClose,
  onSave,
}: Props) {
  const assignableRoles = roles.filter(
    ({ isSuperAdmin }) => !isSuperAdmin,
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState(() =>
    user.roles
      .filter(({ isSuperAdmin }) => !isSuperAdmin)
      .map(({ id }) => id),
  );
  const [confirming, setConfirming] = useState(false);
  const [criticalConfirmed, setCriticalConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const isSelf = user.id === currentUserId;
  const selectedRoles = assignableRoles.filter(({ id }) => selectedRoleIds.includes(id));
  const selectedPermissions = [...new Map(selectedRoles.flatMap(({ permissions }) => permissions).map((permission) => [permission.id, permission])).values()];
  const criticalPermissions = selectedPermissions.filter((permission) => getPermissionRisk(permission) === "CRITICAL");

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  }

  async function handleSave() {
    if (!confirming) { setConfirming(true); return; }
    if (criticalPermissions.length && !criticalConfirmed) return;
    setSaving(true);
    try {
      await onSave(selectedRoleIds);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminDialog
      title="Edit assigned roles"
      description={`Choose access roles for ${user.name}. Effective permissions are inherited from all assigned roles.`}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
          <p className="text-xs font-medium text-stone-700">{user.name}</p>
          <p className="mt-1 text-[11px] text-stone-500">{user.email}</p>
        </div>

        <fieldset disabled={isSelf}>
          <legend className="text-xs font-medium text-stone-700">
            Assignable roles
          </legend>
          {assignableRoles.length ? (
            <div className="mt-2 space-y-2">
              {assignableRoles.map((role) => (
                <label
                  key={role.id}
                  className={`flex items-start gap-3 rounded-md border p-3 ${
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
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-stone-800">
                      {role.name}
                    </span>
                    <span className="mt-1 block text-[10px] text-stone-500">
                      {role.description || role.slug}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-stone-400">
                    {role.permissions.length} permissions
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-md border border-dashed border-stone-200 p-4 text-xs text-stone-500">
              No assignable staff or custom roles are available.
            </p>
          )}
        </fieldset>

        <div className="rounded-md border border-stone-200 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
            Protected assignments
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.roles
              .filter(({ isSuperAdmin }) => isSuperAdmin)
              .map((role) => (
                <span
                  key={role.id}
                  className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] text-stone-600"
                >
                  {role.name} · locked
                </span>
              ))}
            {!user.roles.some(({ isSuperAdmin }) => isSuperAdmin) && (
              <span className="text-[11px] text-stone-400">No protected system roles</span>
            )}
          </div>
        </div>

        {isSelf && (
          <p className="text-[11px] text-stone-500">
            Your own role assignments are locked to prevent self-escalation.
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 rounded-md border border-stone-200 px-3.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSelf || confirming || saving}
            className="h-9 rounded-md bg-stone-900 px-4 text-xs font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving roles…" : "Review role impact"}
          </button>
        </div>
        {confirming && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950"><p className="font-medium">This account will receive effective access from the selected roles.</p><p className="mt-1 text-[11px]">{selectedRoles.map(({ name }) => name).join(", ") || "No roles"} · {selectedPermissions.length} distinct permissions</p>{criticalPermissions.length > 0 && <><p className="mt-2">Critical capabilities: {criticalPermissions.map(({ resource, action }) => `${resource}:${action}`).join(", ")}</p><label className="mt-3 flex gap-2"><input type="checkbox" checked={criticalConfirmed} onChange={(event) => setCriticalConfirmed(event.target.checked)} /><span>I understand these roles grant critical administrative access.</span></label></>}<button type="button" onClick={() => void handleSave()} disabled={saving || (criticalPermissions.length > 0 && !criticalConfirmed)} className="mt-3 rounded bg-stone-900 px-3 py-2 text-white disabled:opacity-40">{saving ? "Saving roles…" : "Confirm selected roles"}</button></div>}
          <p className="text-right text-[10px] text-stone-400">Role assignments are saved through the protected admin API.</p>
      </div>
    </AdminDialog>
  );
}
