"use client";

import type { AdminPermission } from "@/components/admin/management/management-types";
import { formatPermissionAction, groupPermissions } from "@/components/admin/management/permission-groups";

type Props = {
  catalog: AdminPermission[];
  selectedPermissionIds: string[];
  onChange: (permissionIds: string[]) => void;
  disabled?: boolean;
};

export default function PermissionMatrix({
  catalog,
  selectedPermissionIds,
  onChange,
  disabled = false,
}: Props) {
  const groups = groupPermissions(catalog);
  const selected = new Set(selectedPermissionIds);

  function togglePermission(permissionId: string) {
    onChange(
      selected.has(permissionId)
        ? selectedPermissionIds.filter((id) => id !== permissionId)
        : [...selectedPermissionIds, permissionId],
    );
  }

  function toggleGroup(permissionIds: string[]) {
    const groupIsSelected = permissionIds.every((id) => selected.has(id));
    const next = groupIsSelected
      ? selectedPermissionIds.filter((id) => !permissionIds.includes(id))
      : [...new Set([...selectedPermissionIds, ...permissionIds])];
    onChange(next);
  }

  if (!catalog.length) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-500">
        No permission definitions are available in the current database catalog.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const permissionIds = group.permissions.map(({ id }) => id);
        const groupIsSelected = permissionIds.every((id) => selected.has(id));
        return (
          <section key={group.resource} className="overflow-hidden rounded-lg border border-stone-200">
            <div className="flex items-center justify-between gap-4 bg-stone-50 px-4 py-3">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.15em] text-stone-400">{group.group}</p>
                <h3 className="mt-1 text-sm font-medium text-stone-800">{group.label}</h3>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-[11px] text-stone-600">
                <input
                  type="checkbox"
                  checked={groupIsSelected}
                  disabled={disabled}
                  onChange={() => toggleGroup(permissionIds)}
                  className="size-3.5 accent-stone-900"
                  aria-label={`Select all ${group.label} permissions`}
                />
                Select all
              </label>
            </div>
            <div className="divide-y divide-stone-100">
              {group.permissions.map((permission) => (
                <label key={permission.id} className={`flex min-h-12 items-center gap-3 px-4 py-2.5 ${disabled ? "cursor-default" : "cursor-pointer hover:bg-stone-50/70"}`}>
                  <input
                    type="checkbox"
                    checked={selected.has(permission.id)}
                    disabled={disabled}
                    onChange={() => togglePermission(permission.id)}
                    className="size-4 shrink-0 accent-stone-900"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-stone-700">{permission.name}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-stone-400">{permission.resource}:{permission.action}</span>
                  </span>
                  <span className="hidden rounded-full border border-stone-200 px-2 py-1 text-[9px] text-stone-500 sm:inline-flex">
                    {formatPermissionAction(permission.action)}
                  </span>
                </label>
              ))}
            </div>
          </section>
        );
      })}
      <p className="text-right text-[11px] text-stone-500" aria-live="polite">
        {selectedPermissionIds.length} of {catalog.length} permissions selected
      </p>
    </div>
  );
}
