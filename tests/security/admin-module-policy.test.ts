import assert from "node:assert/strict";
import test from "node:test";
import { canAccessAdminModule, canPromoteToSuperAdmin } from "../../lib/admin-module-policy";

test("only database-confirmed Super Admins may access Overview and System modules", () => {
  const delegatedKeys = ["dashboard:access", "roles:create", "roles:update", "roles:delete", "roles:assign_permissions", "users:assign_role"];
  for (const key of delegatedKeys) {
    assert.equal(canAccessAdminModule(false, [key], { superAdminOnly: true }), false);
  }
  assert.equal(canAccessAdminModule(true, [], { superAdminOnly: true }), true);
});

test("store modules use their own read permission and do not require dashboard access", () => {
  assert.equal(canAccessAdminModule(false, ["inventory:read"], { requiredPermission: "inventory:read" }), true);
  assert.equal(canAccessAdminModule(false, ["dashboard:access"], { requiredPermission: "inventory:read" }), false);
  assert.equal(canAccessAdminModule(false, ["products:create"], { requiredPermission: "products:read" }), false);
  assert.equal(canAccessAdminModule(true, [], { requiredPermission: "products:read" }), true);
});

test("Super Admin promotion requires an active, verified Admin and never marks it protected", () => {
  const eligible = {
    isActive: true,
    emailVerified: true,
    isProtectedSuperAdmin: false,
    hasAdminRole: true,
    hasSuperAdminRole: false,
  };
  assert.equal(canPromoteToSuperAdmin(eligible), true);
  assert.equal(canPromoteToSuperAdmin({ ...eligible, emailVerified: false }), false);
  assert.equal(canPromoteToSuperAdmin({ ...eligible, isActive: false }), false);
  assert.equal(canPromoteToSuperAdmin({ ...eligible, hasAdminRole: false }), false);
  assert.equal(canPromoteToSuperAdmin({ ...eligible, isProtectedSuperAdmin: true }), false);
  assert.equal(canPromoteToSuperAdmin({ ...eligible, hasSuperAdminRole: true }), false);
});
