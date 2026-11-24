export type AdminModulePolicy = {
  superAdminOnly?: boolean;
  requiredPermission?: string;
};

/** The same policy is used by server page guards and sidebar visibility. */
export function canAccessAdminModule(
  isSuperAdmin: boolean,
  permissionKeys: ReadonlySet<string> | readonly string[],
  module: AdminModulePolicy,
) {
  if (module.superAdminOnly) return isSuperAdmin;
  if (isSuperAdmin) return true;
  if (!module.requiredPermission) return false;
  return Array.isArray(permissionKeys)
    ? permissionKeys.includes(module.requiredPermission)
    : (permissionKeys as ReadonlySet<string>).has(module.requiredPermission);
}

export type SuperAdminPromotionCandidate = {
  isActive: boolean;
  emailVerified: boolean;
  isProtectedSuperAdmin: boolean;
  hasAdminRole: boolean;
  hasSuperAdminRole: boolean;
};

export function canPromoteToSuperAdmin(user: SuperAdminPromotionCandidate) {
  return (
    user.isActive &&
    user.emailVerified &&
    !user.isProtectedSuperAdmin &&
    user.hasAdminRole &&
    !user.hasSuperAdminRole
  );
}
