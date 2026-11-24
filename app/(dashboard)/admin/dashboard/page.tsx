import { requireAdmin } from "@/lib/dal";
import AdminDashboardShell from "@/components/admin/AdminDashboardShell";
import { getAdminPage, isAdminPageKey } from "@/components/admin/admin-navigation";
import { getAdminAccessRemovals, getAdminInvitations, getAdminRoleData, getManagedAdminUsers, getUserPermissionKeys } from "@/lib/admin-management";
import { canAccessAdminModule } from "@/lib/admin-module-policy";
import type { AdminPermission, AdminRoleSummary, ManagedAdminUser } from "@/components/admin/management/management-types";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin/dashboard">) {
  const { session, access } = await requireAdmin();
  const params = await searchParams;
  const requestedView = Array.isArray(params.view) ? params.view[0] : params.view;
  const activeView = isAdminPageKey(requestedView) ? requestedView : "dashboard";
  const activePage = getAdminPage(activeView);
  if (!canAccessAdminModule(access.isSuperAdmin, access.permissions, activePage)) redirect("/admin/forbidden");
  const permissionKeys = await getUserPermissionKeys(session.user.id);
  const canInvite = Boolean(access?.isSuperAdmin);
  const canAssignRoles = Boolean(access?.isSuperAdmin);
  const canViewUsers = access.isSuperAdmin;
  const canCreateRoles = Boolean(access?.isSuperAdmin);
  const canUpdateRoles = Boolean(access?.isSuperAdmin);
  const canDeleteRoles = Boolean(access?.isSuperAdmin);
  const canAssignPermissions = Boolean(access?.isSuperAdmin);

  let roles: AdminRoleSummary[] | undefined;
  let permissionCatalog: AdminPermission[] | undefined;
  let managedUsers: ManagedAdminUser[] | undefined;
  let invitations: Awaited<ReturnType<typeof getAdminInvitations>> | undefined;
  let accessRemovals: Awaited<ReturnType<typeof getAdminAccessRemovals>> | undefined;

  if (activeView === "admin-users") {
    const [roleData, adminUsers, adminInvitations, adminAccessRemovals] = await Promise.all([
      canInvite ? getAdminRoleData() : Promise.resolve({ roles: [], permissionCatalog: [] }), getManagedAdminUsers(), canInvite ? getAdminInvitations() : Promise.resolve([]), canInvite ? getAdminAccessRemovals() : Promise.resolve([]),
    ]);
    roles = roleData.roles;
    managedUsers = adminUsers;
    invitations = adminInvitations;
    accessRemovals = adminAccessRemovals;
  } else if (activeView === "roles-permissions") {
    const [roleData, adminUsers] = await Promise.all([
      getAdminRoleData(),
      canViewUsers ? getManagedAdminUsers() : Promise.resolve([]),
    ]);
    roles = roleData.roles;
    permissionCatalog = roleData.permissionCatalog;
    managedUsers = adminUsers;
  }

  return (
    <AdminDashboardShell
      activeView={activeView}
      adminName={session.user.name}
      currentUserId={session.user.id}
      permissionKeys={permissionKeys}
      isSuperAdmin={access.isSuperAdmin}
      roles={roles}
      permissionCatalog={permissionCatalog}
      managedUsers={managedUsers}
      invitations={invitations}
      accessRemovals={accessRemovals}
      canAssignRoles={canAssignRoles}
      canInvite={canInvite}
      canDeactivateUsers={permissionKeys.includes("users:deactivate")}
      canRevokeSessions={permissionKeys.includes("users:revoke_sessions")}
      actorIsProtectedSuperAdmin={access.isProtectedSuperAdmin}
      canCreateRoles={canCreateRoles}
      canUpdateRoles={canUpdateRoles}
      canDeleteRoles={canDeleteRoles}
      canAssignPermissions={canAssignPermissions}
      canViewUsers={canViewUsers}
    />
  );
}
