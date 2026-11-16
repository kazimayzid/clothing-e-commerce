export type AdminPermission = {
  id: string;
  name: string;
  resource: string;
  action: string;
};

export type AdminRoleSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  assignedUserCount: number;
  permissions: AdminPermission[];
};

export type AdminUserRole = Pick<AdminRoleSummary, "id" | "name" | "slug" | "permissions">;

export type ManagedAdminUser = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles: AdminUserRole[];
};
