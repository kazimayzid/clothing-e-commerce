import type { AdminPermission } from "@/components/admin/management/management-types";

const resourcePresentation: Record<string, { group: string; label: string }> = {
  dashboard: { group: "OVERVIEW", label: "Dashboard" },
  users: { group: "SYSTEM", label: "Admin Users" },
  roles: { group: "SYSTEM", label: "Roles & Permissions" },
  products: { group: "STORE MANAGEMENT", label: "Products" },
  orders: { group: "STORE MANAGEMENT", label: "Orders" },
};

export type PermissionGroup = {
  group: string;
  resource: string;
  label: string;
  permissions: AdminPermission[];
};

export function groupPermissions(permissions: AdminPermission[]): PermissionGroup[] {
  const groups = new Map<string, PermissionGroup>();

  for (const permission of permissions) {
    const presentation = resourcePresentation[permission.resource] ?? {
      group: "OTHER PERMISSIONS",
      label: permission.resource,
    };
    const key = permission.resource;
    const current = groups.get(key) ?? {
      group: presentation.group,
      resource: permission.resource,
      label: presentation.label,
      permissions: [],
    };
    current.permissions.push(permission);
    groups.set(key, current);
  }

  return [...groups.values()];
}

export function formatPermissionAction(action: string) {
  const labels: Record<string, string> = {
    access: "Access",
    assign_role: "Assign roles",
    manage: "Manage",
    read: "Read",
    create: "Create",
    update: "Update",
    delete: "Delete",
  };
  return labels[action] ?? action.replaceAll("_", " ");
}
