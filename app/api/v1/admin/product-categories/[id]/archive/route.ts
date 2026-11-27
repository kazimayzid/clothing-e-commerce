import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { revalidatePublicCategoryData } from "@/lib/product-category-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireAdminApiPermission("products:archive");
  if ("response" in authorization) return authorization.response;
  const { id } = await params;
  try {
    const category = await prisma.$transaction(async (tx) => {
      const before = await tx.productCategory.findUnique({ where: { id } });
      if (!before) throw new Error("NOT_FOUND");
      if (before.archivedAt) throw new Error("ARCHIVED");
      const [productCount, activeChildCount] = await Promise.all([
        tx.product.count({ where: { categoryId: id } }),
        tx.productCategory.count({ where: { parentId: id, archivedAt: null } }),
      ]);
      if (productCount || activeChildCount) throw new Error("IN_USE");
      const updated = await tx.productCategory.update({ where: { id }, data: { archivedAt: new Date() } });
      await appendAdminAuditLog(tx, { actor: authorization.context, action: "product_categories.archived", category: "PRODUCT", riskLevel: "MEDIUM", description: `Archived product category ${before.name}.`, targetType: "PRODUCT_CATEGORY", targetId: id, targetName: before.name, beforeState: before, afterState: updated, changedFields: ["archivedAt"], request });
      return updated;
    });
    revalidatePublicCategoryData();
    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ error: "Category not found." }, { status: 404 });
    if (error instanceof Error && error.message === "ARCHIVED") return NextResponse.json({ error: "Category is already archived." }, { status: 409 });
    if (error instanceof Error && error.message === "IN_USE") return NextResponse.json({ error: "Move its products and child categories before archiving this category." }, { status: 409 });
    return NextResponse.json({ error: "Could not archive category." }, { status: 500 });
  }
}
