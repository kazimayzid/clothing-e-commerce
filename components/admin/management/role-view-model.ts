export type RoleMembership = { id: string; scope: "ADMIN" | "CUSTOMER" };
export type UserWithRoleMemberships<TMembership extends RoleMembership = RoleMembership> = {
  roles: readonly TMembership[];
};

export function isAssignedToAdminRole(user: UserWithRoleMemberships, selectedRoleId: string) {
  return user.roles.some((role) => role.id === selectedRoleId && role.scope === "ADMIN");
}

export function getUsersAssignedToAdminRole<TUser extends UserWithRoleMemberships>(users: readonly TUser[], selectedRoleId: string) {
  return users.filter((user) => isAssignedToAdminRole(user, selectedRoleId));
}

export function splitVisibleRoles<TRole>(roles: readonly TRole[], visibleLimit = 2) {
  return {
    visible: roles.slice(0, visibleLimit),
    remaining: roles.slice(visibleLimit),
  };
}
