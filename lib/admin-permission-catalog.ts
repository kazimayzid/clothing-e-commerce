export const ADMIN_PERMISSION_CATALOG = [
  { name: "Access dashboard", resource: "dashboard", action: "access", description: "Allows access to the staff dashboard." },
  { name: "View products", resource: "products", action: "read", description: "Allows viewing product information." },
  { name: "Create products", resource: "products", action: "create", description: "Allows creating products." },
  { name: "Update products", resource: "products", action: "update", description: "Allows editing products." },
  { name: "Archive products", resource: "products", action: "archive", description: "Allows archiving products." },
  { name: "View orders", resource: "orders", action: "read", description: "Allows viewing customer orders." },
  { name: "Update order status", resource: "orders", action: "update_status", description: "Allows changing order status." },
  { name: "Cancel orders", resource: "orders", action: "cancel", description: "Allows cancelling orders." },
  { name: "View inventory", resource: "inventory", action: "read", description: "Allows viewing inventory levels." },
  { name: "Adjust inventory", resource: "inventory", action: "adjust", description: "Allows adjusting inventory levels." },
  { name: "View shipping", resource: "shipping", action: "read", description: "Allows viewing shipping information." },
  { name: "Update shipping status", resource: "shipping", action: "update_status", description: "Allows updating shipment status." },
  { name: "Update tracking", resource: "shipping", action: "update_tracking", description: "Allows updating tracking details." },
  { name: "View users", resource: "users", action: "read", description: "Allows viewing customer and admin accounts." },
  { name: "Invite administrators", resource: "users", action: "invite", description: "Allows inviting internal team members." },
  { name: "Assign roles", resource: "users", action: "assign_role", description: "Allows assigning existing admin roles." },
  { name: "Deactivate users", resource: "users", action: "deactivate", description: "Allows disabling user accounts." },
  { name: "Revoke sessions", resource: "users", action: "revoke_sessions", description: "Allows revoking user sessions." },
  { name: "View roles", resource: "roles", action: "read", description: "Allows viewing roles and the permission catalog." },
  { name: "Create roles", resource: "roles", action: "create", description: "Allows creating admin roles." },
  { name: "Update roles", resource: "roles", action: "update", description: "Allows updating admin roles and permissions." },
  { name: "Delete roles", resource: "roles", action: "delete", description: "Allows deleting unprotected admin roles." },
  { name: "Assign role permissions", resource: "roles", action: "assign_permissions", description: "Allows assigning catalog permissions to roles." },
  // Keep the original broad keys while existing pages and custom roles migrate.
  { name: "Manage products (legacy)", resource: "products", action: "manage", description: "Legacy broad product access retained for backward compatibility." },
  { name: "Manage orders (legacy)", resource: "orders", action: "manage", description: "Legacy broad order access retained for backward compatibility." },
  { name: "Manage roles (legacy)", resource: "roles", action: "manage", description: "Legacy broad role management access retained for backward compatibility." },
] as const;

export type AdminPermissionKey = `${(typeof ADMIN_PERMISSION_CATALOG)[number]["resource"]}:${(typeof ADMIN_PERMISSION_CATALOG)[number]["action"]}`;

export const ADMIN_PERMISSION_KEY_SET = new Set<string>(
  ADMIN_PERMISSION_CATALOG.map(({ resource, action }) => `${resource}:${action}`),
);
