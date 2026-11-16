"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import AdminDialog from "@/components/admin/management/AdminDialog";
import PermissionMatrix from "@/components/admin/management/PermissionMatrix";
import { formatAdminDate } from "@/components/admin/admin-utils";
import type { AdminPermission, AdminRoleSummary, ManagedAdminUser } from "@/components/admin/management/management-types";

type Props = {
  role: AdminRoleSummary;
  catalog: AdminPermission[];
  users: ManagedAdminUser[];
  canViewUsers: boolean;
  canAssignRoles: boolean;
  currentUserId: string;
  onClose: () => void;
  onSaveAssignments: (userIds: string[]) => void;
};

const tabs = ["Overview", "Permissions", "Assigned Users"] as const;
type Tab = (typeof tabs)[number];

export default function RoleDetailsDialog({
  role,
  catalog,
  users,
  canViewUsers,
  canAssignRoles,
  currentUserId,
  onClose,
  onSaveAssignments,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const roleIsProtected = role.slug === "admin";
  const initialUserIds = users.filter((user) => user.roles.some((userRole) => userRole.id === role.id)).map(({ id }) => id);
  const [selectedUserIds, setSelectedUserIds] = useState(initialUserIds);
  const [isEditingAssignments, setIsEditingAssignments] = useState(false);
  const isSystemRole = ["admin", "staff", "user"].includes(role.slug);
  const rolePermissions = useMemo(() => new Set(role.permissions.map(({ id }) => id)), [role.permissions]);

  function toggleUser(userId: string) {
    setSelectedUserIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]);
  }

  function saveAssignments() {
    onSaveAssignments(selectedUserIds);
    toast.info("Prototype only — role assignments have not been saved to the database.");
    setIsEditingAssignments(false);
  }

  return (
    <AdminDialog title={role.name} description={role.description ?? "No role description has been added."} onClose={onClose} size="lg">
      <div className="flex flex-wrap gap-2 px-5 pt-4 sm:px-6">
        {isSystemRole && <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-medium text-stone-600">System role</span>}
        {roleIsProtected && <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-700">Protected full-access role</span>}
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] text-stone-600">{role.assignedUserCount} assigned users</span>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] text-stone-600">{role.permissions.length} permissions</span>
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-stone-200 px-5 sm:px-6" role="tablist" aria-label="Role details">
        {tabs.map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-medium ${activeTab === tab ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="max-h-[60dvh] overflow-y-auto p-5 sm:p-6">
        {activeTab === "Overview" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-stone-200 p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-stone-400">Role name</p><p className="mt-2 text-sm font-medium text-stone-800">{role.name}</p></div>
            <div className="rounded-lg border border-stone-200 p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-stone-400">Role slug</p><p className="mt-2 font-mono text-xs text-stone-700">{role.slug}</p></div>
            <div className="rounded-lg border border-stone-200 p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-stone-400">Created</p><p className="mt-2 text-sm text-stone-700">{formatAdminDate(role.createdAt)}</p></div>
            <div className="rounded-lg border border-stone-200 p-4"><p className="text-[10px] uppercase tracking-[0.12em] text-stone-400">Access summary</p><p className="mt-2 text-sm text-stone-700">{role.permissions.length} permissions across {new Set(role.permissions.map(({ resource }) => resource)).size} modules</p></div>
            <div className="rounded-lg border border-stone-200 p-4 sm:col-span-2"><p className="text-[10px] uppercase tracking-[0.12em] text-stone-400">Description</p><p className="mt-2 text-sm leading-6 text-stone-600">{role.description || "No description"}</p></div>
          </div>
        )}

        {activeTab === "Permissions" && (
          <div>
            <p className="mb-4 text-xs text-stone-500">Permissions are read from the existing database catalog. No unsupported resource/action combinations are shown.</p>
            <PermissionMatrix catalog={catalog} selectedPermissionIds={[...rolePermissions]} onChange={() => undefined} disabled />
          </div>
        )}

        {activeTab === "Assigned Users" && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h3 className="text-sm font-medium text-stone-800">Assigned Admin & Staff</h3><p className="mt-1 text-[11px] text-stone-500">The role total includes all accounts assigned to it.</p></div>
              {canViewUsers && canAssignRoles && !roleIsProtected && (
                <button type="button" onClick={() => setIsEditingAssignments((editing) => !editing)} className="rounded-md border border-stone-200 px-3 py-2 text-[11px] font-medium text-stone-600 hover:bg-stone-50">{isEditingAssignments ? "Cancel" : "Manage users"}</button>
              )}
            </div>
            {!canViewUsers ? (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-xs leading-5 text-stone-600">User names are hidden because this account does not have the <code className="font-mono">users:read</code> permission.</div>
            ) : users.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-xs text-stone-500">No admin or staff accounts are available for this role.</div>
            ) : (
              <div className="divide-y divide-stone-100 rounded-lg border border-stone-200">
                {users.map((user) => {
                  const assigned = selectedUserIds.includes(user.id);
                  return (
                    <label key={user.id} className={`flex items-center gap-3 px-4 py-3 ${isEditingAssignments && user.id !== currentUserId ? "cursor-pointer hover:bg-stone-50" : ""}`}>
                      {isEditingAssignments && canAssignRoles && !roleIsProtected && <input type="checkbox" checked={assigned} disabled={user.id === currentUserId} onChange={() => toggleUser(user.id)} className="size-4 accent-stone-900" aria-label={`${assigned ? "Remove" : "Assign"} ${role.name} for ${user.name}`} />}
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-medium text-stone-600">{user.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-stone-800">{user.name}</span><span className="mt-0.5 block truncate text-[10px] text-stone-500">{user.email}</span></span>
                      <span className={`rounded-full px-2 py-1 text-[9px] ${user.isActive ? "bg-stone-100 text-stone-600" : "bg-stone-200 text-stone-500"}`}>{user.isActive ? "Active" : "Inactive"}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {isEditingAssignments && canViewUsers && canAssignRoles && !roleIsProtected && (
              <div className="mt-4 flex items-center justify-between gap-3"><p className="text-[10px] text-stone-400">Prototype only. Your own role assignment is locked.</p><button type="button" onClick={saveAssignments} className="rounded-md bg-stone-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-stone-700">Save preview</button></div>
            )}
          </div>
        )}
      </div>
    </AdminDialog>
  );
}
