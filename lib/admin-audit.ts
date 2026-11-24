import "server-only";

import { headers } from "next/headers";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { AdminAccessContext } from "@/lib/admin-access";

type AuditClient = PrismaClient | Prisma.TransactionClient;
type AuditInput = {
  actor: Pick<
    AdminAccessContext,
    "userId" | "name" | "email" | "roles" | "isSuperAdmin"
  >;
  action: string;
  category: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  targetType: string;
  targetId?: string | null;
  targetName?: string | null;
  targetEmail?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  permissionId?: string | null;
  permissionKey?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  changedFields?: unknown;
  success?: boolean;
  failureCode?: string | null;
  request?: Request;
};

const limit = (value: string | null | undefined, max: number) =>
  value?.slice(0, max) ?? null;

function json(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function appendAdminAuditLog(
  client: AuditClient,
  input: AuditInput,
) {
  const requestHeaders = input.request
    ? new Headers(input.request.headers)
    : await headers();
  const forwarded =
    requestHeaders.get("x-vercel-forwarded-for") ??
    requestHeaders.get("x-forwarded-for");
  const requestIp = forwarded?.split(",")[0]?.trim() ?? null;
  const actorRoles = input.actor.roles.map(
    ({ id, name, slug, isSuperAdmin }) => ({ id, name, slug, isSuperAdmin }),
  );

  return client.adminAuditLog.create({
    data: {
      actorUserId: input.actor.userId,
      actorName: limit(input.actor.name, 200),
      actorEmail: limit(input.actor.email, 320),
      actorRoles,
      actorIsSuperAdmin: input.actor.isSuperAdmin,
      action: input.action,
      category: input.category,
      riskLevel: input.riskLevel ?? "LOW",
      description: input.description,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      targetName: limit(input.targetName, 200),
      targetEmail: limit(input.targetEmail, 320),
      roleId: input.roleId ?? null,
      roleName: limit(input.roleName, 100),
      permissionId: input.permissionId ?? null,
      permissionKey: limit(input.permissionKey, 160),
      beforeState: json(input.beforeState),
      afterState: json(input.afterState),
      changedFields: json(input.changedFields),
      requestIp: limit(requestIp, 100),
      userAgent: requestHeaders.get("user-agent"),
      requestId: limit(
        requestHeaders.get("x-vercel-id") ?? requestHeaders.get("x-request-id"),
        200,
      ),
      success: input.success ?? true,
      failureCode: input.failureCode ?? null,
    },
  });
}
