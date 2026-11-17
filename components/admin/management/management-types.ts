export type AdminPermission = {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
};

export type AdminRoleSummary = {
  id: string;
  name: string;
  slug: string;
  isSuperAdmin: boolean;
  scope: "ADMIN";
  description: string | null;
  createdAt: string;
  assignedUserCount: number;
  permissions: AdminPermission[];
};

export type AdminUserRole = Pick<AdminRoleSummary, "id" | "name" | "slug" | "permissions" | "isSuperAdmin">;

export type ManagedAdminUser = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles: AdminUserRole[];
};

export type AdminInvitationSummary = {
  id: string;
  email: string;
  name: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  sentAt: string | null;
  emailStatus: "NOT_ATTEMPTED" | "SENDING" | "ACCEPTED_BY_PROVIDER" | "FAILED" | "UNKNOWN";
  providerEmailId: string | null;
  emailAttemptedAt: string | null;
  lastEmailError: string | null;
  createdAt: string;
  roles: { id: string; name: string; slug: string }[];
};
