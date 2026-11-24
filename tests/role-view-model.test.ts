import assert from "node:assert/strict";
import test from "node:test";
import {
  getUsersAssignedToAdminRole,
  isAssignedToAdminRole,
  splitVisibleRoles,
  type RoleMembership,
} from "../components/admin/management/role-view-model";

type TestUser = { id: string; name: string; email: string; isActive: boolean; roles: RoleMembership[] };
const staffRole = { id: "role-staff", scope: "ADMIN" as const };
const hrRole = { id: "role-hr", scope: "ADMIN" as const };
const financeRole = { id: "role-finance", scope: "ADMIN" as const };

test("role detail uses exact UserRole membership for Staff-only and Staff plus HR users", () => {
  const users: TestUser[] = [
    { id: "one", name: "Staff Only", email: "one@example.test", isActive: true, roles: [staffRole] },
    { id: "two", name: "Staff and HR", email: "two@example.test", isActive: false, roles: [staffRole, hrRole] },
  ];

  assert.deepEqual(getUsersAssignedToAdminRole(users, staffRole.id).map(({ id }) => id), ["one", "two"]);
  assert.deepEqual(getUsersAssignedToAdminRole(users, hrRole.id).map(({ id }) => id), ["two"]);
  assert.equal(isAssignedToAdminRole(users[1], hrRole.id), true);
  assert.equal(isAssignedToAdminRole(users[1], "role-not-assigned"), false);
});

test("empty roles have an empty assigned list and multiple members are all returned", () => {
  const users: TestUser[] = [
    { id: "one", name: "One", email: "one@example.test", isActive: true, roles: [hrRole] },
    { id: "two", name: "Two", email: "two@example.test", isActive: true, roles: [hrRole] },
  ];

  assert.deepEqual(getUsersAssignedToAdminRole(users, "role-empty"), []);
  assert.deepEqual(getUsersAssignedToAdminRole(users, hrRole.id).map(({ id }) => id), ["one", "two"]);
});

test("role removal and assignment immediately change exact-role membership", () => {
  const initial: TestUser = { id: "one", name: "One", email: "one@example.test", isActive: true, roles: [staffRole, hrRole] };
  const afterRemoval = { ...initial, roles: initial.roles.filter(({ id }) => id !== hrRole.id) };
  const afterAssignment = { ...afterRemoval, roles: [...afterRemoval.roles, hrRole] };

  assert.equal(isAssignedToAdminRole(initial, hrRole.id), true);
  assert.equal(isAssignedToAdminRole(afterRemoval, hrRole.id), false);
  assert.equal(isAssignedToAdminRole(afterAssignment, hrRole.id), true);
});

test("CUSTOMER-scoped membership is never counted as an ADMIN role member", () => {
  const customerUser: TestUser = {
    id: "customer",
    name: "Customer",
    email: "customer@example.test",
    isActive: true,
    roles: [{ id: hrRole.id, scope: "CUSTOMER" }],
  };

  assert.equal(isAssignedToAdminRole(customerUser, hrRole.id), false);
  assert.deepEqual(getUsersAssignedToAdminRole([customerUser], hrRole.id), []);
});

test("Staff table reveals additional roles after the first two", () => {
  const roles = [staffRole, hrRole, financeRole];
  const display = splitVisibleRoles(roles);

  assert.deepEqual(display.visible, roles.slice(0, 2));
  assert.deepEqual(display.remaining, [financeRole]);
  assert.deepEqual(splitVisibleRoles([staffRole, hrRole]).remaining, []);
});
