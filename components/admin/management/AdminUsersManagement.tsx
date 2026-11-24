"use client";

import { useMemo, useState } from "react";
import {
  KeyRound,
  Search,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
  MailCheck,
  ShieldOff,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";

import AdminInviteDialog from "@/components/admin/management/AdminInviteDialog";
import AdminRoleAssignmentDialog from "@/components/admin/management/AdminRoleAssignmentDialog";
import { splitVisibleRoles } from "@/components/admin/management/role-view-model";
import AdminStatusBadge from "@/components/admin/management/AdminStatusBadge";
import AdminUserDetailsDialog from "@/components/admin/management/AdminUserDetailsDialog";
import AdminDialog from "@/components/admin/management/AdminDialog";
import ManagementStatCard from "@/components/admin/management/ManagementStatCard";
import { formatAdminDate } from "@/components/admin/admin-utils";
import type {
  AdminInvitationSummary,
  AdminAccessRemovalSummary,
  AdminRoleSummary,
  ManagedAdminUser,
} from "@/components/admin/management/management-types";

type Props = {
  initialUsers: ManagedAdminUser[];
  roles: AdminRoleSummary[];
  canAssignRoles: boolean;
  canInvite: boolean;
  canDeactivateUsers: boolean;
  canRevokeSessions: boolean;
  actorIsProtectedSuperAdmin: boolean;
  initialInvitations: AdminInvitationSummary[];
  initialAccessRemovals: AdminAccessRemovalSummary[];
  currentUserId: string;
};

export default function AdminUsersManagement({
  initialUsers,
  roles,
  canAssignRoles,
  canInvite,
  canDeactivateUsers,
  canRevokeSessions,
  actorIsProtectedSuperAdmin,
  initialInvitations,
  initialAccessRemovals,
  currentUserId,
}: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [accessRemovals, setAccessRemovals] = useState(initialAccessRemovals);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const [rolesUserId, setRolesUserId] = useState<string | null>(null);
  const [promotionUserId, setPromotionUserId] = useState<string | null>(null);
  const [promotionConfirmed, setPromotionConfirmed] = useState(false);
  const [promotionPending, setPromotionPending] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(() => new Set());

  function isPending(actionId: string) {
    return pendingActions.has(actionId);
  }

  async function withPending(actionId: string, action: () => Promise<void>) {
    if (isPending(actionId)) return;
    setPendingActions((current) => new Set(current).add(actionId));
    try {
      await action();
    } finally {
      setPendingActions((current) => {
        const next = new Set(current);
        next.delete(actionId);
        return next;
      });
    }
  }

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
  const promotionUser = users.find(({ id }) => id === promotionUserId) ?? null;
  const activeCount = users.filter(({ isActive }) => isActive).length;
  const inactiveCount = users.length - activeCount;

  async function saveUserRoles(userId: string, selectedRoleIds: string[]) {
    const selected = new Set(selectedRoleIds);
    await withPending(`roles:${userId}`, async () => {
      try {
        const response = await fetch(`/api/v1/admin/users/${userId}/roles`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleIds: [...selected] }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Unable to save role assignments.");
        const assignableRoles = roles.filter(
          ({ isSuperAdmin }) => !isSuperAdmin,
        );
        setUsers((current) =>
          current.map((user) => {
            if (user.id !== userId) return user;
            const protectedRoles = user.roles.filter(
              ({ isSuperAdmin }) => isSuperAdmin,
            );
            const selectedRoles = assignableRoles
              .filter(({ id }) => selected.has(id))
              .map(({ id, name, slug, scope, permissions, isSuperAdmin }) => ({
                id,
                name,
                slug,
                scope,
                permissions,
                isSuperAdmin,
              }));
            return { ...user, roles: [...protectedRoles, ...selectedRoles] };
          }),
        );
        toast.success("Role assignments saved");
        setRolesUserId(null);
      } catch (cause) {
        toast.error(
          cause instanceof Error
            ? cause.message
            : "Unable to save role assignments.",
        );
        throw cause;
      }
    });
  }

  async function updateUserStatus(userId: string, isActive: boolean) {
    await withPending(`status:${userId}`, async () => { try {
      const response = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to update account status.");
      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, isActive } : user,
        ),
      );
      toast.success(
        isActive
          ? "Account activated"
          : "Account deactivated; sessions revoked",
      );
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to update account status.",
      );
    } });
  }

  async function revokeUserSessions(userId: string) {
    await withPending(`revoke:${userId}`, async () => { try {
      const response = await fetch(
        `/api/v1/admin/users/${userId}/revoke-sessions`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to revoke sessions.");
      toast.success(
        `${data.revoked} session${data.revoked === 1 ? "" : "s"} revoked`,
      );
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to revoke sessions.",
      );
    } });
  }

  async function promoteToSuperAdmin(user: ManagedAdminUser) {
    setPromotionPending(true);
    try {
      const response = await fetch(
        `/api/v1/admin/users/${user.id}/promote-super-admin`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to promote this account.");
      const specialRole = roles.find(
        ({ id, isSuperAdmin }) => id === data.roleId && isSuperAdmin,
      );
      if (!specialRole)
        throw new Error(
          "Promotion succeeded, but the role summary is stale. Reload this page.",
        );
      setUsers((current) =>
        current.map((entry) =>
          entry.id === user.id
            ? {
                ...entry,
                roles: [
                  ...entry.roles,
                  { ...specialRole, scope: "ADMIN" as const },
                ],
              }
            : entry,
        ),
      );
      setPromotionUserId(null);
      setPromotionConfirmed(false);
      toast.success(`${user.name} is now a Super Admin`);
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to promote this account.",
      );
    } finally {
      setPromotionPending(false);
    }
  }

  async function removeAdminAccess(user: ManagedAdminUser) {
    const roleNames = user.roles.map(({ name }) => name).join(", ");
    if (
      !window.confirm(
        `Remove Admin access for ${user.name}? This removes ${roleNames}, revokes their active sessions, and preserves their customer account and data.`,
      )
    )
      return;
    await withPending(`remove:${user.id}`, async () => { try {
      const response = await fetch(
        `/api/v1/admin/users/${user.id}/remove-admin-access`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to remove Admin access.");
      setUsers((current) => current.filter(({ id }) => id !== user.id));
      setAccessRemovals((current) => [
        data.removal,
        ...current.filter(({ id }) => id !== data.removal.id),
      ]);
      if (data.emailAcceptedByProvider)
        toast.success(
          "Admin access removed; SMTP accepted the notification. Inbox delivery is unconfirmed.",
        );
      else if (data.removal.emailStatus === "FAILED")
        toast.error(
          `Admin access was removed; notification failed: ${data.removal.lastEmailError ?? "Retry the notification below."}`,
        );
      else
        toast.error(
          `Admin access was removed; SMTP acceptance is unconfirmed: ${data.removal.lastEmailError ?? "Review the notification status below."}`,
        );
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to remove Admin access.",
      );
    } });
  }

  async function retryRemovalNotification(id: string) {
    const removal = accessRemovals.find((entry) => entry.id === id);
    if (
      removal?.emailStatus === "UNKNOWN" &&
      !window.confirm(
        "The previous SMTP result is unknown. Retrying may send a duplicate notification. Retry anyway?",
      )
    )
      return;
    await withPending(`retry:${id}`, async () => { try {
      const response = await fetch(
        `/api/v1/admin/access-removals/${id}/retry`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to retry notification.");
      setAccessRemovals((current) =>
        current.map((removal) => (removal.id === id ? data.removal : removal)),
      );
      if (data.emailAcceptedByProvider)
        toast.success(
          "SMTP accepted the notification; inbox delivery is unconfirmed.",
        );
      else
        toast.error(
          data.removal.lastEmailError ??
            "SMTP acceptance could not be confirmed.",
        );
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Unable to retry notification.",
      );
    } });
  }

  async function testSmtpConnection() {
    await withPending("smtp-test", async () => { try {
      const response = await fetch("/api/v1/admin/email/test", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "SMTP connection test failed.");
      toast.success(
        data.message || "SMTP connection verified; no email was sent.",
      );
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "SMTP connection test failed.",
      );
    } });
  }

  return (
    <div className="space-y-5">
      <section
        aria-label="Admin account statistics"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
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
              <h2 className="font-serif text-lg text-stone-900">
                Admin Directory
              </h2>
              <p className="mt-1 text-[11px] text-stone-500">
                Users with the existing Admin or Staff role
              </p>
            </div>
            {canInvite && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void testSmtpConnection()}
                  disabled={isPending("smtp-test")}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
                >
                  {isPending("smtp-test") ? <LoaderCircle className="size-3.5 animate-spin" /> : <MailCheck className="size-3.5" />}
                  {isPending("smtp-test") ? "Testing SMTP…" : "Test SMTP"}
                </button>
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="h-9 rounded-md bg-stone-900 px-3.5 text-xs font-medium text-white hover:bg-stone-700"
                >
                  Add Admin / Invite Staff
                </button>
              </div>
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
              {filteredUsers.map((user) => {
                const { visible: visibleRoles, remaining: remainingRoles } =
                  splitVisibleRoles(user.roles);
                return (
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
                        <span className="font-medium text-stone-800">
                          {user.name}
                        </span>
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {user.email}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex max-w-64 flex-wrap items-center gap-1">
                        {user.isProtectedSuperAdmin && (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[9px] font-medium text-violet-800">
                            Protected
                          </span>
                        )}
                        {user.roles.length ? (
                          visibleRoles.map((role) => (
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
                        {remainingRoles.length > 0 && (
                          <details className="basis-full text-[9px]">
                            <summary
                              className="inline-flex cursor-pointer list-none items-center rounded-full bg-stone-100 px-2 py-1 text-stone-600 hover:bg-stone-200"
                              title={remainingRoles
                                .map(({ name }) => name)
                                .join(", ")}
                              aria-label={`Show ${remainingRoles.length} more role${remainingRoles.length === 1 ? "" : "s"}`}
                            >
                              +{remainingRoles.length}
                            </summary>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {remainingRoles.map((role) => (
                                <span
                                  key={role.id}
                                  className="rounded-full border border-stone-200 bg-white px-2 py-1 text-[9px] text-stone-600"
                                >
                                  {role.name}
                                </span>
                              ))}
                            </div>
                          </details>
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
                        <div className="absolute right-0 z-30 mt-1 w-56 rounded-md border border-stone-200 bg-white p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={(event) => {
                              setDetailsUserId(user.id);
                              event.currentTarget
                                .closest("details")
                                ?.removeAttribute("open");
                            }}
                            className="w-full rounded px-3 py-2 text-left text-[11px] text-stone-700 hover:bg-stone-50"
                          >
                            View details
                          </button>
                          {canAssignRoles &&
                            user.id !== currentUserId &&
                            !user.isProtectedSuperAdmin && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  setRolesUserId(user.id);
                                  event.currentTarget
                                    .closest("details")
                                    ?.removeAttribute("open");
                                }}
                                disabled={isPending(`roles:${user.id}`)}
                                className="w-full rounded px-3 py-2 text-left text-[11px] text-stone-700 hover:bg-stone-50"
                              >
                                Edit roles
                              </button>
                            )}
                          {canInvite &&
                            user.isActive &&
                            user.emailVerified &&
                            !user.isProtectedSuperAdmin &&
                            !user.roles.some(
                              ({ isSuperAdmin }) => isSuperAdmin,
                            ) && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  setPromotionUserId(user.id);
                                  setPromotionConfirmed(false);
                                  event.currentTarget
                                    .closest("details")
                                    ?.removeAttribute("open");
                                }}
                                className="w-full rounded px-3 py-2 text-left text-[11px] font-medium text-violet-800 hover:bg-violet-50"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <ShieldCheck className="size-3.5" />
                                  Promote to Super Admin
                                </span>
                              </button>
                            )}
                          {canDeactivateUsers &&
                            user.id !== currentUserId &&
                            !user.isProtectedSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  void updateUserStatus(
                                    user.id,
                                    !user.isActive,
                                  );
                                }}
                                disabled={isPending(`status:${user.id}`)}
                                aria-busy={isPending(`status:${user.id}`)}
                                className="w-full rounded px-3 py-2 text-left text-[11px] text-stone-700 hover:bg-stone-50"
                              >
                                {isPending(`status:${user.id}`) ? "Updating…" : user.isActive
                                  ? "Deactivate account"
                                  : "Activate account"}
                              </button>
                            )}
                          {canRevokeSessions &&
                            user.id !== currentUserId &&
                            (!user.isProtectedSuperAdmin || actorIsProtectedSuperAdmin) && (
                            <button
                              type="button"
                              onClick={() => {
                                void revokeUserSessions(user.id);
                              }}
                              disabled={isPending(`revoke:${user.id}`)}
                              aria-busy={isPending(`revoke:${user.id}`)}
                              className="w-full rounded px-3 py-2 text-left text-[11px] text-stone-700 hover:bg-stone-50"
                            >
                              {isPending(`revoke:${user.id}`) ? "Revoking sessions…" : "Revoke sessions"}
                            </button>
                          )}
                          {canInvite &&
                            user.id !== currentUserId &&
                            !user.isProtectedSuperAdmin &&
                            !user.roles.some(
                              ({ isSuperAdmin }) => isSuperAdmin,
                            ) && (
                              <button
                                type="button"
                                onClick={() => {
                                  void removeAdminAccess(user);
                                }}
                                disabled={isPending(`remove:${user.id}`)}
                                aria-busy={isPending(`remove:${user.id}`)}
                                className="w-full rounded px-3 py-2 text-left text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                <span className="inline-flex items-center gap-2">
                                  {isPending(`remove:${user.id}`) ? <LoaderCircle className="size-3.5 animate-spin" /> : <ShieldOff className="size-3.5" />}
                                  {isPending(`remove:${user.id}`) ? "Removing access…" : "Remove Admin Access"}
                                </span>
                              </button>
                            )}
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-stone-500"
                  >
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
          <span>
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
          <span>Last login is not available in the current schema.</span>
        </div>
      </section>

      {canInvite && (
        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-5 py-4">
            <h2 className="font-serif text-lg text-stone-900">
              Team invitations
            </h2>
            <p className="mt-1 text-[11px] text-stone-500">
              Invitation status and email delivery history
            </p>
          </div>
          <div className="divide-y divide-stone-100">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-stone-800">
                    {invitation.name} · {invitation.email}
                  </p>
                  <p className="mt-1 text-[10px] text-stone-500">
                    {invitation.roles.map(({ name }) => name).join(", ")} ·{" "}
                    {invitation.emailStatus === "ACCEPTED_BY_PROVIDER"
                      ? `${invitation.emailProvider} accepted · inbox delivery unconfirmed`
                      : invitation.emailStatus === "FAILED"
                        ? "Email request failed"
                        : invitation.emailStatus === "UNKNOWN"
                          ? `${invitation.emailProvider} result unknown · check logs`
                          : invitation.emailStatus === "SENDING"
                            ? "Email request in progress"
                            : "Email not attempted"}
                  </p>
                  {invitation.providerEmailId && (
                    <p className="mt-1 font-mono text-[9px] text-stone-400">
                      Message ID: {invitation.providerEmailId}
                    </p>
                  )}
                  {invitation.lastEmailError && (
                    <p className="mt-1 text-[10px] text-red-700">
                      {invitation.lastEmailError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[10px] text-stone-600">
                    {invitation.status.toLowerCase()}
                  </span>
                  {invitation.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          void invitationAction(invitation.id, "resend")
                        }
                        className="text-[10px] font-medium text-stone-700 underline"
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void invitationAction(invitation.id, "revoke")
                        }
                        className="text-[10px] font-medium text-red-700 underline"
                      >
                        Revoke
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {invitations.length === 0 && (
              <p className="px-5 py-8 text-center text-xs text-stone-500">
                No invitations yet.
              </p>
            )}
          </div>
        </section>
      )}

      {canInvite && (
        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-5 py-4">
            <h2 className="font-serif text-lg text-stone-900">
              Admin access removal notifications
            </h2>
            <p className="mt-1 text-[11px] text-stone-500">
              Access changes are recorded before email delivery; failed messages
              can be retried.
            </p>
          </div>
          <div className="divide-y divide-stone-100">
            {accessRemovals.map((removal) => (
              <div
                key={removal.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-stone-800">
                    {removal.recipientName} · {removal.recipientEmail}
                  </p>
                  <p className="mt-1 text-[10px] text-stone-500">
                    Removed roles:{" "}
                    {removal.removedRoles.map(({ name }) => name).join(", ")} ·{" "}
                    {removal.emailStatus === "ACCEPTED_BY_PROVIDER"
                      ? "SMTP accepted · inbox delivery unconfirmed"
                      : removal.emailStatus === "FAILED"
                        ? "Notification failed"
                        : removal.emailStatus === "UNKNOWN"
                          ? "SMTP result unknown · inspect logs"
                          : removal.emailStatus === "SENDING"
                            ? "Sending notification"
                            : "Notification not attempted"}
                  </p>
                  {removal.providerEmailId && (
                    <p className="mt-1 font-mono text-[9px] text-stone-400">
                      Message ID: {removal.providerEmailId}
                    </p>
                  )}
                  {removal.lastEmailError && (
                    <p className="mt-1 text-[10px] text-red-700">
                      {removal.lastEmailError}
                    </p>
                  )}
                </div>
                {(removal.emailStatus === "FAILED" ||
                  removal.emailStatus === "UNKNOWN") && (
                  <button
                    type="button"
                    onClick={() => void retryRemovalNotification(removal.id)}
                    disabled={isPending(`retry:${removal.id}`)}
                    className="text-[10px] font-medium text-stone-700 underline"
                  >
                    {isPending(`retry:${removal.id}`) ? "Retrying…" : "Retry notification"}
                  </button>
                )}
              </div>
            ))}
            {accessRemovals.length === 0 && (
              <p className="px-5 py-8 text-center text-xs text-stone-500">
                No Admin access removals yet.
              </p>
            )}
          </div>
        </section>
      )}

      {inviteOpen && (
        <AdminInviteDialog
          roles={roles}
          onClose={() => setInviteOpen(false)}
          onCreated={(invite) =>
            setInvitations((current) => [
              invite,
              ...current.filter(({ id }) => id !== invite.id),
            ])
          }
        />
      )}
      {promotionUser && (
        <AdminDialog
          title="Promote to Super Admin?"
          description="This is a high-privilege, immediate access change."
          onClose={() => {
            if (!promotionPending) {
              setPromotionUserId(null);
              setPromotionConfirmed(false);
            }
          }}
          size="md"
        >
          <div className="space-y-4 p-5 sm:p-6">
            <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-xs leading-5 text-rose-950">
              <p className="font-semibold">Full administrative access</p>
              <p className="mt-1">
                {promotionUser.name} will gain every Store and Business
                capability, plus access to Overview, Admin Users, Roles &amp;
                Permissions, Settings, and Activity Logs. This account will not
                become the Protected Super Admin.
              </p>
            </div>
            <div className="rounded-md border border-stone-200 p-3 text-xs">
              <p className="font-medium text-stone-800">{promotionUser.name}</p>
              <p className="mt-1 text-stone-500">
                {promotionUser.email} · Email verified · Active
              </p>
            </div>
            <label className="flex items-start gap-2 text-xs leading-5 text-stone-700">
              <input
                type="checkbox"
                checked={promotionConfirmed}
                onChange={(event) =>
                  setPromotionConfirmed(event.target.checked)
                }
                className="mt-1"
              />
              <span>
                I understand this grants full Super Admin access and will be
                recorded in the security audit log.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={promotionPending}
                onClick={() => {
                  setPromotionUserId(null);
                  setPromotionConfirmed(false);
                }}
                className="rounded-md border border-stone-200 px-3 py-2 text-xs text-stone-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!promotionConfirmed || promotionPending}
                onClick={() => void promoteToSuperAdmin(promotionUser)}
                className="rounded-md bg-violet-900 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {promotionPending ? "Promoting…" : "Confirm promotion"}
              </button>
            </div>
          </div>
        </AdminDialog>
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

  async function invitationAction(id: string, action: "resend" | "revoke") {
    try {
      const response = await fetch(
        `/api/v1/admin/invitations/${id}/${action}`,
        { method: "POST" },
      );
      const data = await response.json();
      if (data.invitation)
        setInvitations((current) =>
          current.map((invitation) =>
            invitation.id === id ? data.invitation : invitation,
          ),
        );
      if (!response.ok)
        throw new Error(data.error || `Unable to ${action} invitation.`);
      if (action === "revoke")
        setInvitations((current) =>
          current.map((invitation) =>
            invitation.id === id
              ? { ...invitation, status: "REVOKED" }
              : invitation,
          ),
        );
      toast.success(
        action === "revoke"
          ? "Invitation revoked"
          : "SMTP accepted the request; inbox delivery is unconfirmed.",
      );
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : `Unable to ${action} invitation.`,
      );
    }
  }
}
