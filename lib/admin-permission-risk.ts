import type { AdminPermission } from "@/components/admin/management/management-types";

export type PermissionRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function getPermissionRisk(permission: Pick<AdminPermission, "resource" | "action">): PermissionRisk {
  const key = `${permission.resource}:${permission.action}`;
  if (["roles:create", "roles:update", "roles:delete", "roles:assign_permissions", "users:assign_role", "users:invite"].includes(key)) return "CRITICAL";
  if (["users:deactivate", "users:revoke_sessions", "orders:update", "inventory:update", "shipping:update"].includes(key)) return "HIGH";
  if (permission.action === "read" || permission.action === "access") return "LOW";
  return "MEDIUM";
}
