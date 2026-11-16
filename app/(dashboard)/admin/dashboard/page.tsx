import { requirePermission } from "@/lib/dal";
import AdminDashboardShell from "@/components/admin/AdminDashboardShell";
import { isAdminPageKey } from "@/components/admin/admin-navigation";
import { getAdminRoleData, getManagedAdminUsers, getUserPermissionKeys } from "@/lib/admin-management";
import type { AdminPermission, AdminRoleSummary, ManagedAdminUser } from "@/components/admin/management/management-types";

export default async function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin/dashboard">) {
  const session = await requirePermission("dashboard", "access");
  const params = await searchParams;
  const requestedView = Array.isArray(params.view) ? params.view[0] : params.view;
  const activeView = isAdminPageKey(requestedView) ? requestedView : "dashboard";
  const permissionKeys = await getUserPermissionKeys(session.user.id);
  const canAssignRoles = permissionKeys.includes("users:assign_role");
  const canViewUsers = permissionKeys.includes("users:read");

  let roles: AdminRoleSummary[] | undefined;
  let permissionCatalog: AdminPermission[] | undefined;
  let managedUsers: ManagedAdminUser[] | undefined;

  if (activeView === "admin-users") {
    await requirePermission("users", "read");
    const [roleData, adminUsers] = await Promise.all([getAdminRoleData(), getManagedAdminUsers()]);
    roles = roleData.roles;
    managedUsers = adminUsers;
  } else if (activeView === "roles-permissions") {
    await requirePermission("roles", "manage");
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
      canAssignRoles={canAssignRoles}
      canViewUsers={canViewUsers}
    />
  );
}
