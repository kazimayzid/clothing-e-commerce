"use client";

import { useMemo } from "react";
import AdminDialog from "@/components/admin/management/AdminDialog";
import AdminStatusBadge from "@/components/admin/management/AdminStatusBadge";
import type { ManagedAdminUser } from "@/components/admin/management/management-types";
import { formatAdminDate } from "@/components/admin/admin-utils";

export default function AdminUserDetailsDialog({
  user,
  onClose,
}: {
  user: ManagedAdminUser;
  onClose: () => void;
}) {
  const effectivePermissions = useMemo(() => {
    const byId = new Map(
      user.roles
        .flatMap(({ permissions }) => permissions)
        .map((permission) => [permission.id, permission]),
    );
    return [...byId.values()].sort(
      (a, b) =>
        a.resource.localeCompare(b.resource) ||
        a.action.localeCompare(b.action),
    );
  }, [user.roles]);

  return (
    <AdminDialog
      title="Admin user details"
      description="Assigned roles and the effective permissions inherited from those roles."
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-5 p-5 sm:p-6">
        <section className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-stone-50/60 p-4 sm:flex-row sm:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700">
            {user.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("")}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-stone-900">
              {user.name}
            </h3>
            <p className="mt-1 truncate text-xs text-stone-500">{user.email}</p>
          </div>
          <AdminStatusBadge active={user.isActive} />
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
            Assigned roles
          </h3>
          {user.roles.length ? (
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <span
                  key={role.id}
                  className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-700"
                >
                  {role.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500">No roles assigned</p>
          )}
          <p className="mt-2 text-[10px] text-stone-400">
            These are role assignments only; permissions below are the union
            inherited from every assigned role.
          </p>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              Effective permissions
            </h3>
            <span className="text-[10px] text-stone-400">
              {effectivePermissions.length} total
            </span>
          </div>
          {effectivePermissions.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {effectivePermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-stone-200 px-3 py-2"
                >
                  <span className="truncate text-[11px] text-stone-700">
                    {permission.name}
                  </span>
                  <code className="shrink-0 font-mono text-[9px] text-stone-400">
                    {permission.resource}:{permission.action}
                  </code>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-stone-200 p-4 text-xs text-stone-500">
              No permissions are inherited from the assigned roles.
            </div>
          )}
        </section>

        <section className="grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-stone-400">
              Created
            </p>
            <p className="mt-1 text-xs text-stone-700">
              {formatAdminDate(user.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-stone-400">
              Last login
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Not tracked in the current schema
            </p>
          </div>
        </section>
      </div>
    </AdminDialog>
  );
}
