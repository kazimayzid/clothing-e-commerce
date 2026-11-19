import { requirePermission } from "@/lib/dal";
import AdminDashboardShell from "@/components/admin/AdminDashboardShell";
import { getAdminPage, isAdminPageKey } from "@/components/admin/admin-navigation";
import { getAdminAccessRemovals, getAdminInvitations, getAdminRoleData, getManagedAdminUsers, getUserPermissionKeys } from "@/lib/admin-management";
import { getAdminAccessContext } from "@/lib/admin-access";
import type { AdminPermission, AdminRoleSummary, ManagedAdminUser } from "@/components/admin/management/management-types";

export default async function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin/dashboard">) {
  const session = await requirePermission("dashboard", "access");
  const params = await searchParams;
  const requestedView = Array.isArray(params.view) ? params.view[0] : params.view;
  const activeView = isAdminPageKey(requestedView) ? requestedView : "dashboard";
  const activePage = getAdminPage(activeView);
  if ("requiredPermission" in activePage) {
    const [resource, action] = activePage.requiredPermission.split(":");
    await requirePermission(resource, action);
  }
  const permissionKeys = await getUserPermissionKeys(session.user.id);
  const access = await getAdminAccessContext(session.user.id);
  const canInvite = Boolean(access?.isSuperAdmin);
  const canAssignRoles = permissionKeys.includes("users:assign_role");
  const canViewUsers = permissionKeys.includes("users:read");
  const canCreateRoles = permissionKeys.includes("roles:create");
  const canUpdateRoles = permissionKeys.includes("roles:update");
  const canDeleteRoles = permissionKeys.includes("roles:delete");
  const canAssignPermissions = permissionKeys.includes("roles:assign_permissions");

  let roles: AdminRoleSummary[] | undefined;
  let permissionCatalog: AdminPermission[] | undefined;
  let managedUsers: ManagedAdminUser[] | undefined;
  let invitations: Awaited<ReturnType<typeof getAdminInvitations>> | undefined;
  let accessRemovals: Awaited<ReturnType<typeof getAdminAccessRemovals>> | undefined;

  if (activeView === "admin-users") {
    await requirePermission("users", "read");
    const [roleData, adminUsers, adminInvitations, adminAccessRemovals] = await Promise.all([
      getAdminRoleData(), getManagedAdminUsers(), canInvite ? getAdminInvitations() : Promise.resolve([]), canInvite ? getAdminAccessRemovals() : Promise.resolve([]),
    ]);
    roles = roleData.roles;
    managedUsers = adminUsers;
    invitations = adminInvitations;
    accessRemovals = adminAccessRemovals;
  } else if (activeView === "roles-permissions") {
    await requirePermission("roles", "read");
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
      roles={roles}
      permissionCatalog={permissionCatalog}
      managedUsers={managedUsers}
      invitations={invitations}
      accessRemovals={accessRemovals}
      canAssignRoles={canAssignRoles}
      canInvite={canInvite}
      canDeactivateUsers={permissionKeys.includes("users:deactivate")}
      canRevokeSessions={permissionKeys.includes("users:revoke_sessions")}
      canCreateRoles={canCreateRoles}
      canUpdateRoles={canUpdateRoles}
      canDeleteRoles={canDeleteRoles}
      canAssignPermissions={canAssignPermissions}
      canViewUsers={canViewUsers}
    />
  );
}
