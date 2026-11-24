export type SuperAdminStatusDecision = "ALLOW" | "PROTECTED_ACCOUNT" | "SUPER_ADMIN_ONLY" | "LAST_ACTIVE_SUPER_ADMIN";

export function decideSuperAdminStatusChange(input: {
  isDeactivating: boolean;
  actorIsSuperAdmin: boolean;
  targetIsSuperAdmin: boolean;
  targetIsProtectedSuperAdmin: boolean;
  activeSuperAdminCount: number;
}): SuperAdminStatusDecision {
  if (!input.isDeactivating) return "ALLOW";
  if (input.targetIsProtectedSuperAdmin) return "PROTECTED_ACCOUNT";
  if (!input.targetIsSuperAdmin) return "ALLOW";
  if (!input.actorIsSuperAdmin) return "SUPER_ADMIN_ONLY";
  if (input.activeSuperAdminCount <= 1) return "LAST_ACTIVE_SUPER_ADMIN";
  return "ALLOW";
}

export const isSuperAdminManagementAuthorized = (isSuperAdmin: boolean) => isSuperAdmin;

export type SessionRevokeDecision =
  | "ALLOW"
  | "SUPER_ADMIN_REQUIRED"
  | "PROTECTED_SUPER_ADMIN_TARGET"
  | "SELF_TARGET";

export function decideSessionRevoke(input: {
  actorUserId: string;
  targetUserId: string;
  actorIsActive: boolean;
  actorIsSuperAdmin: boolean;
  actorIsProtectedSuperAdmin: boolean;
  targetIsProtectedSuperAdmin: boolean;
}): SessionRevokeDecision {
  if (!input.actorIsActive || !input.actorIsSuperAdmin) {
    return "SUPER_ADMIN_REQUIRED";
  }
  if (input.actorUserId === input.targetUserId) return "SELF_TARGET";
  if (input.targetIsProtectedSuperAdmin && !input.actorIsProtectedSuperAdmin) {
    return "PROTECTED_SUPER_ADMIN_TARGET";
  }
  return "ALLOW";
}

export async function executeSessionRevoke<T>(
  input: Parameters<typeof decideSessionRevoke>[0],
  revoke: () => Promise<T>,
  recordDenied: (decision: Exclude<SessionRevokeDecision, "ALLOW">) => Promise<void>,
): Promise<
  | { allowed: true; result: T }
  | { allowed: false; decision: Exclude<SessionRevokeDecision, "ALLOW"> }
> {
  const decision = decideSessionRevoke(input);
  if (decision !== "ALLOW") {
    await recordDenied(decision);
    return { allowed: false, decision };
  }
  return { allowed: true, result: await revoke() };
}
