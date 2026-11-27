import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { isActiveCategoryPath, wouldCreateCategoryCycle } from "@/lib/category-tree";
import { updateProductCategorySchema } from "@/lib/product-validation";
import { revalidatePublicCategoryData } from "@/lib/product-category-service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const authorization = await requireAdminApiPermission("products:update");
  if ("response" in authorization) return authorization.response;
  const { id } = await params;
  const parsed = updateProductCategorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) return NextResponse.json({ error: "Category changes are invalid.", fields: parsed.success ? {} : parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const category = await prisma.$transaction(async (tx) => {
      const [before, records] = await Promise.all([
        tx.productCategory.findUnique({ where: { id } }),
        tx.productCategory.findMany({ select: { id: true, name: true, slug: true, description: true, parentId: true, archivedAt: true } }),
      ]);
      if (!before) throw new Error("NOT_FOUND");
      const parentId = parsed.data.parentId === undefined ? before.parentId : parsed.data.parentId;
      if (wouldCreateCategoryCycle(id, parentId, records)) throw new Error("CYCLE");
      if (parentId && !isActiveCategoryPath(parentId, records)) throw new Error("PARENT_INVALID");
      const updated = await tx.productCategory.update({ where: { id }, data: parsed.data });
      const moved = parsed.data.parentId !== undefined && parsed.data.parentId !== before.parentId;
      await appendAdminAuditLog(tx, { actor: authorization.context, action: moved ? "product_categories.moved" : "product_categories.updated", category: "PRODUCT", riskLevel: "MEDIUM", description: `${moved ? "Moved" : "Updated"} product category ${updated.name}.`, targetType: "PRODUCT_CATEGORY", targetId: id, targetName: updated.name, beforeState: before, afterState: updated, changedFields: Object.keys(parsed.data), request });
      return updated;
    });
    revalidatePublicCategoryData();
    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ error: "Category not found." }, { status: 404 });
    if (error instanceof Error && error.message === "CYCLE") return NextResponse.json({ error: "A category cannot be moved below itself or one of its descendants." }, { status: 400 });
    if (error instanceof Error && error.message === "PARENT_INVALID") return NextResponse.json({ error: "Choose an active parent category." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "A category with that slug already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not update category." }, { status: 500 });
  }
}
