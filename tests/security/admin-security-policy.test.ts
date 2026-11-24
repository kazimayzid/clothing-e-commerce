import assert from "node:assert/strict";
import test from "node:test";
import { getPermissionRisk } from "../../lib/admin-permission-risk";
import { decideSessionRevoke, decideSuperAdminStatusChange, executeSessionRevoke } from "../../lib/admin-security-policy";

test("Protected Super Admin cannot be deactivated by anyone", () => {
  assert.equal(decideSuperAdminStatusChange({
    isDeactivating: true, actorIsSuperAdmin: true, targetIsSuperAdmin: true,
    targetIsProtectedSuperAdmin: true, activeSuperAdminCount: 3,
  }), "PROTECTED_ACCOUNT");
});

test("non-Super Admin cannot deactivate a Super Admin", () => {
  assert.equal(decideSuperAdminStatusChange({
    isDeactivating: true, actorIsSuperAdmin: false, targetIsSuperAdmin: true,
    targetIsProtectedSuperAdmin: false, activeSuperAdminCount: 3,
  }), "SUPER_ADMIN_ONLY");
});

test("last active Super Admin is protected and other admin deactivation remains allowed", () => {
  const base = { isDeactivating: true, actorIsSuperAdmin: true, targetIsProtectedSuperAdmin: false };
  assert.equal(decideSuperAdminStatusChange({ ...base, targetIsSuperAdmin: true, activeSuperAdminCount: 1 }), "LAST_ACTIVE_SUPER_ADMIN");
  assert.equal(decideSuperAdminStatusChange({ ...base, targetIsSuperAdmin: false, activeSuperAdminCount: 1 }), "ALLOW");
});

test("permission risks flag RBAC grants as critical", () => {
  assert.equal(getPermissionRisk({ resource: "roles", action: "assign_permissions" }), "CRITICAL");
  assert.equal(getPermissionRisk({ resource: "users", action: "assign_role" }), "CRITICAL");
  assert.equal(getPermissionRisk({ resource: "orders", action: "read" }), "LOW");
});

test("secondary Super Admin cannot revoke Protected Primary sessions through the API policy", () => {
  assert.equal(decideSessionRevoke({
    actorUserId: "secondary-admin",
    targetUserId: "protected-primary",
    actorIsActive: true,
    actorIsSuperAdmin: true,
    actorIsProtectedSuperAdmin: false,
    targetIsProtectedSuperAdmin: true,
  }), "PROTECTED_SUPER_ADMIN_TARGET");
});

test("direct backend session-revoke request denies a secondary-to-protected attempt before deleting sessions", async () => {
  let deleteCalled = false;
  let deniedAuditDecision = "";
  const result = await executeSessionRevoke({
    actorUserId: "secondary-admin",
    targetUserId: "protected-primary",
    actorIsActive: true,
    actorIsSuperAdmin: true,
    actorIsProtectedSuperAdmin: false,
    targetIsProtectedSuperAdmin: true,
  }, async () => {
    deleteCalled = true;
    return 2;
  }, async (decision) => {
    deniedAuditDecision = decision;
  });

  assert.deepEqual(result, { allowed: false, decision: "PROTECTED_SUPER_ADMIN_TARGET" });
  assert.equal(deleteCalled, false);
  assert.equal(deniedAuditDecision, "PROTECTED_SUPER_ADMIN_TARGET");
});

test("Protected Primary can revoke another Super Admin's sessions", () => {
  assert.equal(decideSessionRevoke({
    actorUserId: "protected-primary",
    targetUserId: "secondary-admin",
    actorIsActive: true,
    actorIsSuperAdmin: true,
    actorIsProtectedSuperAdmin: true,
    targetIsProtectedSuperAdmin: false,
  }), "ALLOW");
});

test("Normal Admin and self-target session revocation are rejected", () => {
  const request = {
    actorUserId: "staff-admin",
    targetUserId: "other-admin",
    actorIsActive: true,
    actorIsProtectedSuperAdmin: false,
    targetIsProtectedSuperAdmin: false,
  };
  assert.equal(decideSessionRevoke({ ...request, actorIsSuperAdmin: false }), "SUPER_ADMIN_REQUIRED");
  assert.equal(decideSessionRevoke({
    ...request,
    targetUserId: "staff-admin",
    actorIsSuperAdmin: true,
  }), "SELF_TARGET");
});
