import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(160).optional(),
  category: z.string().trim().max(50).optional(),
  action: z.string().trim().max(100).optional(),
  risk: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  roleId: z.string().uuid().optional(),
  permissionKey: z.string().trim().max(160).optional(),
  role: z.string().trim().max(100).optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});

export async function GET(request: Request) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Audit filters are invalid." }, { status: 400 });
  const { page, pageSize, q, category, action, risk, roleId, role, permissionKey, from, to } = parsed.data;
  const where = {
    ...(category ? { category } : {}),
    ...(action ? { action } : {}),
    ...(risk ? { riskLevel: risk } : {}),
    ...(roleId ? { roleId } : {}),
    ...(role ? { roleName: { contains: role, mode: "insensitive" as const } } : {}),
    ...(permissionKey ? { permissionKey } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    ...(q ? { OR: [
      { actorName: { contains: q, mode: "insensitive" as const } },
      { actorEmail: { contains: q, mode: "insensitive" as const } },
      { targetName: { contains: q, mode: "insensitive" as const } },
      { targetEmail: { contains: q, mode: "insensitive" as const } },
      { description: { contains: q, mode: "insensitive" as const } },
      { permissionKey: { contains: q, mode: "insensitive" as const } },
      { roleName: { contains: q, mode: "insensitive" as const } },
    ] } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return NextResponse.json({ logs, page, pageSize, total, totalPages: Math.ceil(total / pageSize) }, { headers: { "Cache-Control": "private, no-store" } });
}
