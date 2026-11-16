"use client";

import { useMemo, useState } from "react";
import { KeyRound, Plus, Search, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { formatAdminDate } from "@/components/admin/admin-utils";
import ManagementStatCard from "@/components/admin/management/ManagementStatCard";
import RoleDetailsDialog from "@/components/admin/management/RoleDetailsDialog";
import RoleEditorDialog, {
  type RoleDraft,
} from "@/components/admin/management/RoleEditorDialog";
import type {
  AdminPermission,
  AdminRoleSummary,
  ManagedAdminUser,
} from "@/components/admin/management/management-types";

type Props = {
  initialRoles: AdminRoleSummary[];
  permissionCatalog: AdminPermission[];
  initialUsers: ManagedAdminUser[];
  canViewUsers: boolean;
  canAssignRoles: boolean;
  currentUserId: string;
};

const builtInSlugs = new Set(["admin", "staff", "user"]);

export default function RolesPermissionsManagement({
  initialRoles,
  permissionCatalog,
  initialUsers,
  canViewUsers,
  canAssignRoles,
  currentUserId,
}: Props) {
  const [roles, setRoles] = useState(initialRoles);
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [editorRole, setEditorRole] = useState<AdminRoleSummary | null | undefined>(
    undefined,
  );
  const [detailsRoleId, setDetailsRoleId] = useState<string | null>(null);

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) =>
        `${role.name} ${role.slug} ${role.description ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [roles, search],
  );
  const selectedDetailsRole = roles.find(({ id }) => id === detailsRoleId) ?? null;
  const systemRoleCount = roles.filter(({ slug }) => builtInSlugs.has(slug)).length;

  function saveRole(draft: RoleDraft) {
    const existingRole = roles.find(({ id }) => id === draft.id);
    const nextRole: AdminRoleSummary = {
      id: draft.id ?? `prototype-${crypto.randomUUID()}`,
      name: draft.name,
      slug: draft.slug,
      description: draft.description || null,
      createdAt: existingRole?.createdAt ?? new Date().toISOString(),
      assignedUserCount: existingRole?.assignedUserCount ?? 0,
      permissions: permissionCatalog.filter(({ id }) => draft.permissionIds.includes(id)),
    };

    setRoles((current) =>
      draft.id
        ? current.map((role) => (role.id === draft.id ? nextRole : role))
        : [nextRole, ...current],
    );
  }

  function saveRoleAssignments(role: AdminRoleSummary, selectedUserIds: string[]) {
    const previousUserCount = users.filter((user) =>
      user.roles.some((userRole) => userRole.id === role.id),
    ).length;
    const selectedUsers = new Set(selectedUserIds);

    setUsers((current) =>
      current.map((user) => {
        const currentlyAssigned = user.roles.some(
          (userRole) => userRole.id === role.id,
        );
        const shouldBeAssigned = selectedUsers.has(user.id);

        if (currentlyAssigned === shouldBeAssigned) return user;

        const nextRoles = shouldBeAssigned
          ? [
              ...user.roles,
              {
                id: role.id,
                name: role.name,
                slug: role.slug,
                permissions: role.permissions,
              },
            ]
          : user.roles.filter((userRole) => userRole.id !== role.id);

        return { ...user, roles: nextRoles };
      }),
    );

    const countDifference = selectedUserIds.length - previousUserCount;
    setRoles((current) =>
      current.map((currentRole) =>
        currentRole.id === role.id
          ? {
              ...currentRole,
              assignedUserCount: Math.max(
                0,
                currentRole.assignedUserCount + countDifference,
              ),
            }
          : currentRole,
      ),
    );
    toast.info("Prototype only — role assignments have not been saved to the database.");
  }

  return (
    <div className="space-y-5">
      <section aria-label="Role statistics" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ManagementStatCard
          label="Total Roles"
          value={roles.length}
          detail="Across the current role catalog"
          icon={KeyRound}
        />
        <ManagementStatCard
          label="System Roles"
          value={systemRoleCount}
          detail="Seeded account roles"
          icon={ShieldCheck}
        />
        <ManagementStatCard
          label="Custom Roles"
          value={roles.length - systemRoleCount}
          detail="Additional role definitions"
          icon={KeyRound}
        />
        <ManagementStatCard
          label="Permission Catalog"
          value={permissionCatalog.length}
          detail="Existing resource/action pairs"
          icon={UsersRound}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-serif text-lg text-stone-900">Role Directory</h2>
            <p className="mt-1 text-[11px] text-stone-500">
              Existing roles and their access assignments
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Search roles</span>
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles"
                className="h-9 w-full rounded-md border border-stone-200 pl-9 pr-3 text-xs outline-none focus:border-stone-500 sm:w-48"
              />
            </label>
            <button
              type="button"
              onClick={() => setEditorRole(null)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-stone-900 px-3.5 text-xs font-medium text-white hover:bg-stone-700"
            >
              <Plus className="size-3.5" />
              Create New Role
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-stone-50 text-[10px] font-medium uppercase tracking-[0.1em] text-stone-400">
              <tr>
                <th className="px-5 py-3">Role</th>
                <th className="px-4 py-3">Assigned users</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRoles.map((role) => {
                const isProtected = role.slug === "admin";
                const isSystem = builtInSlugs.has(role.slug);
                const assignedToCurrentUser = users.some(
                  (user) =>
                    user.id === currentUserId &&
                    user.roles.some((userRole) => userRole.id === role.id),
                );

                return (
                  <tr key={role.id} className="text-stone-600">
                    <td className="px-5 py-4">
                      <div className="font-medium text-stone-800">
                        {role.name}
                        {isProtected && (
                          <span className="ml-2 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[9px] font-medium text-stone-600">
                            Protected
                          </span>
                        )}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-stone-400">{role.slug}</div>
                      <div className="mt-1 max-w-sm text-[10px] text-stone-500">
                        {role.description || "No description"}
                      </div>
                    </td>
                    <td className="px-4 py-4">{role.assignedUserCount}</td>
                    <td className="px-4 py-4">{role.permissions.length}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] text-stone-600">
                        {isSystem ? "System role" : "Custom role"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-stone-500">
                      {formatAdminDate(role.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setDetailsRoleId(role.id)}
                          className="font-medium text-stone-700 underline underline-offset-2 hover:text-stone-950"
                        >
                          Details
                        </button>
                        {!isProtected && !assignedToCurrentUser && (
                          <button
                            type="button"
                            onClick={() => setEditorRole(role)}
                            className="font-medium text-stone-500 hover:text-stone-900"
                          >
                            Edit
                          </button>
                        )}
                        {assignedToCurrentUser && (
                          <span className="text-[10px] text-stone-400">
                            Assigned to you · locked
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-stone-500">
                    No roles match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-stone-100 px-5 py-3 text-[10px] text-stone-400">
          Role edits in this screen are local previews and are not persisted.
        </div>
      </section>

      {editorRole !== undefined && (
        <RoleEditorDialog
          key={editorRole?.id ?? "new-role"}
          role={editorRole ?? undefined}
          catalog={permissionCatalog}
          onClose={() => setEditorRole(undefined)}
          onSave={saveRole}
        />
      )}
      {selectedDetailsRole && (
        <RoleDetailsDialog
          role={selectedDetailsRole}
          catalog={permissionCatalog}
          users={users}
          canViewUsers={canViewUsers}
          canAssignRoles={canAssignRoles}
          currentUserId={currentUserId}
          onClose={() => setDetailsRoleId(null)}
          onSaveAssignments={(userIds) =>
            saveRoleAssignments(selectedDetailsRole, userIds)
          }
        />
      )}
    </div>
  );
}
