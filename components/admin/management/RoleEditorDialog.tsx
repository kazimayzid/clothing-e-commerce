"use client";

import { useState } from "react";
import AdminDialog from "@/components/admin/management/AdminDialog";
import PermissionMatrix from "@/components/admin/management/PermissionMatrix";
import type { AdminPermission, AdminRoleSummary } from "@/components/admin/management/management-types";

export type RoleDraft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  permissionIds: string[];
};

type Props = {
  role?: AdminRoleSummary;
  catalog: AdminPermission[];
  onClose: () => void;
  onSave: (draft: RoleDraft) => Promise<void>;
  canAssignPermissions: boolean;
};

function makeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function RoleEditorDialog({ role, catalog, onClose, onSave, canAssignPermissions }: Props) {
  const [name, setName] = useState(role?.name ?? "");
  const [slug, setSlug] = useState(role?.slug ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissionIds, setPermissionIds] = useState(role?.permissions.map(({ id }) => id) ?? []);
  const [saving, setSaving] = useState(false);
  const protectedRole = role?.isSuperAdmin === true;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (protectedRole || !name.trim() || !slug.trim()) return;
    setSaving(true);
    void onSave({ id: role?.id, name: name.trim(), slug: makeSlug(slug), description: description.trim(), permissionIds: canAssignPermissions ? permissionIds : (role?.permissions.map(({ id }) => id) ?? []) })
      .then(onClose)
      .catch(() => undefined)
      .finally(() => setSaving(false));
  }

  return (
    <AdminDialog
      title={role ? `Edit ${role.name}` : "Create New Role"}
      description="Define a role using only permissions already present in the database catalog."
      onClose={onClose}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        {protectedRole && (
          <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-600">
            This seeded full-access role is protected and cannot be edited.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-stone-700">
            Role name
            <input value={name} onChange={(event) => { setName(event.target.value); if (!role) setSlug(makeSlug(event.target.value)); }} disabled={protectedRole} required maxLength={100} className="mt-2 h-10 w-full rounded-md border border-stone-200 px-3 text-sm font-normal outline-none focus:border-stone-500 disabled:bg-stone-50" placeholder="e.g. Order Manager" />
          </label>
          <label className="text-xs font-medium text-stone-700">
            Role slug
            <input value={slug} onChange={(event) => setSlug(makeSlug(event.target.value))} disabled={protectedRole} required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" className="mt-2 h-10 w-full rounded-md border border-stone-200 px-3 font-mono text-xs font-normal outline-none focus:border-stone-500 disabled:bg-stone-50" placeholder="order-manager" />
          </label>
        </div>
        <label className="block text-xs font-medium text-stone-700">
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={protectedRole} rows={2} maxLength={500} className="mt-2 w-full resize-y rounded-md border border-stone-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-stone-500 disabled:bg-stone-50" placeholder="Describe the access this role provides." />
        </label>
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h3 className="text-sm font-medium text-stone-800">Permission assignments</h3><p className="mt-1 text-[11px] text-stone-500">Only catalog permissions can be assigned.</p></div>
            <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-medium text-stone-600">{permissionIds.length} selected</span>
          </div>
          <PermissionMatrix catalog={catalog} selectedPermissionIds={permissionIds} onChange={setPermissionIds} disabled={protectedRole || !canAssignPermissions} />
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-stone-400">Role access is checked again by the server when saved.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-9 rounded-md border border-stone-200 px-3.5 text-xs font-medium text-stone-600 hover:bg-stone-50">Cancel</button>
            <button type="submit" disabled={saving || protectedRole || !name.trim() || !slug.trim()} className="h-9 rounded-md bg-stone-900 px-4 text-xs font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Saving..." : "Save role"}</button>
          </div>
        </div>
      </form>
    </AdminDialog>
  );
}
