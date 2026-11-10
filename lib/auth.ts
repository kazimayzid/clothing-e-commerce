
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const customerRole = await prisma.role.findUnique({
            where: { slug: "user" },
            select: { id: true },
          });

          if (!customerRole) {
            throw new Error(
              'The "user" role is missing. Run the Prisma seed first.',
            );
          }

          await prisma.userRole.upsert({
            where: {
              userId_roleId: {
                userId: user.id,
                roleId: customerRole.id,
              },
            },
            update: {},
            create: {
              userId: user.id,
              roleId: customerRole.id,
            },
          });
        },
      },
    },
  },
});
