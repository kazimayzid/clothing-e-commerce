"use client";

import { useMemo, useState } from "react";
import {
  KeyRound,
  Search,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import AdminInviteDialog from "@/components/admin/management/AdminInviteDialog";
import AdminRoleAssignmentDialog from "@/components/admin/management/AdminRoleAssignmentDialog";
import AdminStatusBadge from "@/components/admin/management/AdminStatusBadge";
import AdminUserDetailsDialog from "@/components/admin/management/AdminUserDetailsDialog";
import ManagementStatCard from "@/components/admin/management/ManagementStatCard";
import { formatAdminDate } from "@/components/admin/admin-utils";
import type {
  AdminRoleSummary,
  ManagedAdminUser,
} from "@/components/admin/management/management-types";

type Props = {
  initialUsers: ManagedAdminUser[];
  roles: AdminRoleSummary[];
  canAssignRoles: boolean;
  currentUserId: string;
};

export default function AdminUsersManagement({
  initialUsers,
  roles,
  canAssignRoles,
  currentUserId,
}: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const [rolesUserId, setRolesUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const searchMatches = `${user.name} ${user.email}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const roleMatches =
          roleFilter === "all" ||
          user.roles.some(({ slug }) => slug === roleFilter);
        const statusMatches =
          statusFilter === "all" ||
          (statusFilter === "active" ? user.isActive : !user.isActive);

        return searchMatches && roleMatches && statusMatches;
      }),
    [users, search, roleFilter, statusFilter],
  );

  const detailsUser = users.find(({ id }) => id === detailsUserId) ?? null;
  const rolesUser = users.find(({ id }) => id === rolesUserId) ?? null;
  const activeCount = users.filter(({ isActive }) => isActive).length;
  const inactiveCount = users.length - activeCount;

  function saveUserRoles(userId: string, selectedRoleIds: string[]) {
    const selected = new Set(selectedRoleIds);
    const assignableRoles = roles.filter(
      ({ slug }) => slug !== "admin" && slug !== "user",
    );

    setUsers((current) =>
      current.map((user) => {
        if (user.id !== userId) return user;

        const protectedRoles = user.roles.filter(
          ({ slug }) => slug === "admin" || slug === "user",
        );
        const selectedRoles = assignableRoles
          .filter(({ id }) => selected.has(id))
          .map(({ id, name, slug, permissions }) => ({
            id,
            name,
            slug,
            permissions,
          }));

        return { ...user, roles: [...protectedRoles, ...selectedRoles] };
      }),
    );

    toast.info("Prototype only — role assignments have not been saved to the database.");
  }

  return (
    <div className="space-y-5">
      <section aria-label="Admin account statistics" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ManagementStatCard
          label="Total Admin Users"
          value={users.length}
          detail="Administrators and staff"
          icon={UsersRound}
        />
        <ManagementStatCard
          label="Active Admins"
          value={activeCount}
          detail="Accounts enabled for access"
          icon={UserRoundCheck}
        />
        <ManagementStatCard
          label="Inactive Admins"
          value={inactiveCount}
          detail="Accounts currently disabled"
          icon={UserRoundX}
        />
        <ManagementStatCard
          label="Total Roles"
          value={roles.length}
          detail="Existing role definitions"
          icon={KeyRound}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-stone-200 p-4 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-lg text-stone-900">Admin Directory</h2>
              <p className="mt-1 text-[11px] text-stone-500">
                Users with the existing Admin or Staff role
              </p>
            </div>
            {canAssignRoles && (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="h-9 rounded-md bg-stone-900 px-3.5 text-xs font-medium text-white hover:bg-stone-700"
              >
                Add Admin / Invite Staff
              </button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_190px_160px]">
            <label className="relative block">
              <span className="sr-only">Search admin users</span>
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email"
                className="h-9 w-full rounded-md border border-stone-200 pl-9 pr-3 text-xs outline-none focus:border-stone-500"
              />
            </label>

            <label className="sr-only" htmlFor="admin-role-filter">
              Filter by role
            </label>
            <select
              id="admin-role-filter"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-9 rounded-md border border-stone-200 bg-white px-3 text-xs text-stone-600 outline-none focus:border-stone-500"
            >
              <option value="all">All roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.slug}>
                  {role.name}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="admin-status-filter">
              Filter by account status
            </label>
            <select
              id="admin-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-md border border-stone-200 bg-white px-3 text-xs text-stone-600 outline-none focus:border-stone-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-stone-50 text-[10px] font-medium uppercase tracking-[0.1em] text-stone-400">
              <tr>
                <th className="px-5 py-3">Admin / Staff</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Assigned roles</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="text-stone-600">
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => setDetailsUserId(user.id)}
                      className="flex items-center gap-2.5 text-left hover:text-stone-950"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-stone-100 text-[9px] font-medium text-stone-600">
                        {user.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("")}
                      </span>
                      <span className="font-medium text-stone-800">{user.name}</span>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">{user.email}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex max-w-64 flex-wrap gap-1">
                      {user.roles.length ? (
                        user.roles.slice(0, 2).map((role) => (
                          <span
                            key={role.id}
                            className="rounded-full border border-stone-200 px-2 py-1 text-[9px] text-stone-600"
                          >
                            {role.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-stone-400">No roles</span>
                      )}
                      {user.roles.length > 2 && (
                        <span className="px-1 py-1 text-[9px] text-stone-400">
                          +{user.roles.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminStatusBadge active={user.isActive} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-stone-500">
                    {formatAdminDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <details className="group relative">
                      <summary
                        className="flex size-8 cursor-pointer list-none items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:bg-stone-50"
                        aria-label={`Actions for ${user.name}`}
                      >
                        ···
                      </summary>
                      <div className="absolute right-0 z-30 mt-1 w-40 rounded-md border border-stone-200 bg-white p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={(event) => {
                            setDetailsUserId(user.id);
                            event.currentTarget.closest("details")?.removeAttribute("open");
                          }}
                          className="w-full rounded px-3 py-2 text-left text-[11px] text-stone-700 hover:bg-stone-50"
                        >
                          View details
                        </button>
                        {canAssignRoles && user.id !== currentUserId && (
                          <button
                            type="button"
                            onClick={(event) => {
                              setRolesUserId(user.id);
                              event.currentTarget.closest("details")?.removeAttribute("open");
                            }}
                            className="w-full rounded px-3 py-2 text-left text-[11px] text-stone-700 hover:bg-stone-50"
                          >
                            Edit roles
                          </button>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-stone-500">
                    {users.length
                      ? "No admin users match these filters."
                      : "No Admin or Staff accounts found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-1 border-t border-stone-100 px-5 py-3 text-[10px] text-stone-400 sm:flex-row sm:justify-between">
          <span>Showing {filteredUsers.length} of {users.length} accounts</span>
          <span>Last login is not available in the current schema.</span>
        </div>
      </section>

      {inviteOpen && (
        <AdminInviteDialog roles={roles} onClose={() => setInviteOpen(false)} />
      )}
      {detailsUser && (
        <AdminUserDetailsDialog
          user={detailsUser}
          onClose={() => setDetailsUserId(null)}
        />
      )}
      {rolesUser && (
        <AdminRoleAssignmentDialog
          user={rolesUser}
          roles={roles}
          currentUserId={currentUserId}
          onClose={() => setRolesUserId(null)}
          onSave={(roleIds) => saveUserRoles(rolesUser.id, roleIds)}
        />
      )}
    </div>
  );
}
