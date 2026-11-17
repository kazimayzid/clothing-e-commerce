import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ADMIN_PERMISSION_CATALOG } from "../lib/admin-permission-catalog";

const connectionString = process.env.DATABASE_URL;
const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL
  ?.trim()
  .toLowerCase();

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

if (!initialAdminEmail) {
  throw new Error("INITIAL_ADMIN_EMAIL is missing");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // আগে /sign-up দিয়ে এই account তৈরি থাকতে হবে।
  const adminUser = await prisma.user.findUnique({
    where: { email: initialAdminEmail },
    select: { id: true },
  });

  if (!adminUser) {
    throw new Error(
      `No account found for ${initialAdminEmail}. Create it through /sign-up first.`,
    );
  }

  const roleDefinitions = [
    { slug: "user", name: "User", description: "Regular customer account", scope: "CUSTOMER" as const, isSuperAdmin: false },
    { slug: "staff", name: "Staff", description: "Store staff account", scope: "ADMIN" as const, isSuperAdmin: false },
    { slug: "admin", name: "Admin", description: "Full administration access", scope: "ADMIN" as const, isSuperAdmin: true },
  ];

  for (const role of roleDefinitions) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        description: role.description,
        scope: role.scope,
        isSuperAdmin: role.isSuperAdmin,
      },
      create: role,
    });
  }

  const permissionDefinitions = ADMIN_PERMISSION_CATALOG;

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { slug: "admin" },
    select: { id: true },
  });

  const staffRole = await prisma.role.findUniqueOrThrow({
    where: { slug: "staff" },
    select: { id: true },
  });

  let dashboardPermissionId: string | undefined;

  for (const permissionData of permissionDefinitions) {
    const permission = await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: permissionData.resource,
          action: permissionData.action,
        },
      },
      update: { name: permissionData.name, description: permissionData.description },
      create: permissionData,
      select: { id: true },
    });

    // Admin-কে সব seeded permission দাও।
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });

    if (
      permissionData.resource === "dashboard" &&
      permissionData.action === "access"
    ) {
      dashboardPermissionId = permission.id;
    }
  }

  if (!dashboardPermissionId) {
    throw new Error("dashboard:access permission was not created");
  }

  // Staff-কে dashboard access দাও।
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: staffRole.id,
        permissionId: dashboardPermissionId,
      },
    },
    update: {},
    create: {
      roleId: staffRole.id,
      permissionId: dashboardPermissionId,
    },
  });

  // নির্দিষ্ট bootstrap account-কে admin role দাও।
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log(`Admin role assigned to ${initialAdminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
