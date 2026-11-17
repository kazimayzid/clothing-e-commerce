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
  canCreateRoles: boolean;
  canUpdateRoles: boolean;
  canDeleteRoles: boolean;
  canAssignPermissions: boolean;
  currentUserId: string;
};

const builtInSlugs = new Set(["admin", "staff"]);

export default function RolesPermissionsManagement({
  initialRoles,
  permissionCatalog,
  initialUsers,
  canViewUsers,
  canAssignRoles,
  canCreateRoles,
  canUpdateRoles,
  canDeleteRoles,
  canAssignPermissions,
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

  async function saveRole(draft: RoleDraft) {
    const existingRole = roles.find(({ id }) => id === draft.id);
    try {
      const response = await fetch(draft.id ? `/api/v1/admin/roles/${draft.id}` : "/api/v1/admin/roles", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          slug: draft.slug,
          description: draft.description,
          permissionIds: draft.id ? undefined : (canAssignPermissions ? draft.permissionIds : []),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save role.");
      const roleId = draft.id ?? data.role.id;
      if (draft.id && canAssignPermissions) {
        const permissionResponse = await fetch(`/api/v1/admin/roles/${roleId}/permissions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionIds: draft.permissionIds }),
        });
        const permissionData = await permissionResponse.json();
        if (!permissionResponse.ok) throw new Error(permissionData.error || "Role saved, but its permission assignments could not be updated.");
      }
      const nextRole: AdminRoleSummary = {
        id: roleId,
        name: draft.name,
        slug: draft.slug,
        description: draft.description || null,
        scope: "ADMIN",
        isSuperAdmin: false,
        createdAt: existingRole?.createdAt ?? new Date().toISOString(),
        assignedUserCount: existingRole?.assignedUserCount ?? 0,
        permissions: canAssignPermissions ? permissionCatalog.filter(({ id }) => draft.permissionIds.includes(id)) : (existingRole?.permissions ?? []),
      };
      setRoles((current) => draft.id ? current.map((role) => (role.id === draft.id ? nextRole : role)) : [nextRole, ...current]);
      toast.success(draft.id ? "Role updated" : "Role created");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to save role.");
      throw cause;
    }
  }

  async function saveRoleAssignments(role: AdminRoleSummary, selectedUserIds: string[]) {
    const previousUserCount = users.filter((user) =>
      user.roles.some((userRole) => userRole.id === role.id),
    ).length;
    const selectedUsers = new Set(selectedUserIds);

    try {
      const response = await fetch(`/api/v1/admin/roles/${role.id}/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save role assignments.");
      setUsers((current) => current.map((user) => {
        const currentlyAssigned = user.roles.some((userRole) => userRole.id === role.id);
        const shouldBeAssigned = selectedUsers.has(user.id);
        if (currentlyAssigned === shouldBeAssigned) return user;
        const nextRole = { id: role.id, name: role.name, slug: role.slug, permissions: role.permissions, isSuperAdmin: false };
        return { ...user, roles: shouldBeAssigned ? [...user.roles, nextRole] : user.roles.filter((userRole) => userRole.id !== role.id) };
      }));
      const countDifference = selectedUserIds.length - previousUserCount;
      setRoles((current) => current.map((currentRole) => currentRole.id === role.id ? { ...currentRole, assignedUserCount: Math.max(0, currentRole.assignedUserCount + countDifference) } : currentRole));
      toast.success("Role assignments saved");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to save role assignments.");
      throw cause;
    }
  }

  function deleteRole(role: AdminRoleSummary) {
    void (async () => {
      if (!window.confirm(`Delete the ${role.name} role?`)) return;
      const response = await fetch(`/api/v1/admin/roles/${role.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete role.");
      setRoles((current) => current.filter(({ id }) => id !== role.id));
      toast.success("Role deleted");
    })().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to delete role."));
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
            {canCreateRoles && <button
              type="button"
              onClick={() => setEditorRole(null)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-stone-900 px-3.5 text-xs font-medium text-white hover:bg-stone-700"
            >
              <Plus className="size-3.5" />
              Create New Role
            </button>}
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
                const isProtected = role.isSuperAdmin;
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
                        {!isProtected && !assignedToCurrentUser && canUpdateRoles && (
                          <button
                            type="button"
                            onClick={() => setEditorRole(role)}
                            className="font-medium text-stone-500 hover:text-stone-900"
                          >
                            Edit
                          </button>
                        )}
                        {!isProtected && role.assignedUserCount === 0 && canDeleteRoles && (
                          <button type="button" onClick={() => deleteRole(role)} className="font-medium text-red-600 hover:text-red-800">Delete</button>
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
          Role changes are validated against the server permission catalog.
        </div>
      </section>

      {editorRole !== undefined && (
        <RoleEditorDialog
          key={editorRole?.id ?? "new-role"}
          role={editorRole ?? undefined}
          catalog={permissionCatalog}
          onClose={() => setEditorRole(undefined)}
          onSave={saveRole}
          canAssignPermissions={canAssignPermissions}
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
          onSaveAssignments={(userIds) => saveRoleAssignments(selectedDetailsRole, userIds)}
        />
      )}
    </div>
  );
}
