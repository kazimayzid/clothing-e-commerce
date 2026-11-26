import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { isActiveCategoryPath } from "@/lib/category-tree";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireAdminApiPermission("products:archive");
  if ("response" in authorization) return authorization.response;
  const { id } = await params;
  try {
    const category = await prisma.$transaction(async (tx) => {
      const before = await tx.productCategory.findUnique({ where: { id } });
      if (!before) throw new Error("NOT_FOUND");
      if (!before.archivedAt) throw new Error("ACTIVE");
      const records = await tx.productCategory.findMany({ select: { id: true, name: true, slug: true, description: true, parentId: true, archivedAt: true } });
      if (before.parentId && !isActiveCategoryPath(before.parentId, records)) throw new Error("PARENT_ARCHIVED");
      const updated = await tx.productCategory.update({ where: { id }, data: { archivedAt: null } });
      await appendAdminAuditLog(tx, { actor: authorization.context, action: "product_categories.restored", category: "PRODUCT", riskLevel: "MEDIUM", description: `Restored product category ${before.name}.`, targetType: "PRODUCT_CATEGORY", targetId: id, targetName: before.name, beforeState: before, afterState: updated, changedFields: ["archivedAt"], request });
      return updated;
    });
    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ error: "Category not found." }, { status: 404 });
    if (error instanceof Error && error.message === "ACTIVE") return NextResponse.json({ error: "Category is already active." }, { status: 409 });
    if (error instanceof Error && error.message === "PARENT_ARCHIVED") return NextResponse.json({ error: "Restore the parent category first." }, { status: 409 });
    return NextResponse.json({ error: "Could not restore category." }, { status: 500 });
  }
}
