import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { buildCategoryTree, isActiveCategoryPath, resolveCategoryPath } from "@/lib/category-tree";
import { createProductCategorySchema } from "@/lib/product-validation";

export async function GET() {
  const authorization = await requireAdminApiPermission("products:read");
  if ("response" in authorization) return authorization.response;
  const [categories, counts] = await Promise.all([
    prisma.productCategory.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] }),
    prisma.product.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);
  const records = categories.map(({ id, name, slug, description, parentId, archivedAt }) => ({ id, name, slug, description, parentId, archivedAt }));
  const countById = new Map(counts.map(({ categoryId, _count }) => [categoryId, _count._all]));
  return NextResponse.json({ categories: buildCategoryTree(records, true), flatCategories: records.map((category) => ({
    ...category,
    path: resolveCategoryPath(category.id, records) ?? [],
    productCount: countById.get(category.id) ?? 0,
    childCount: records.filter(({ parentId, archivedAt }) => parentId === category.id && !archivedAt).length,
  })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const authorization = await requireAdminApiPermission("products:create");
  if ("response" in authorization) return authorization.response;
  const parsed = createProductCategorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Category details are invalid.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const input = parsed.data;
  try {
    const category = await prisma.$transaction(async (tx) => {
      const records = await tx.productCategory.findMany({ select: { id: true, name: true, slug: true, description: true, parentId: true, archivedAt: true } });
      if (input.parentId && !isActiveCategoryPath(input.parentId, records)) throw new Error("PARENT_INVALID");
      const created = await tx.productCategory.create({ data: { name: input.name, slug: input.slug, description: input.description ?? null, parentId: input.parentId ?? null } });
      await appendAdminAuditLog(tx, { actor: authorization.context, action: "product_categories.created", category: "PRODUCT", riskLevel: "MEDIUM", description: `Created product category ${created.name}.`, targetType: "PRODUCT_CATEGORY", targetId: created.id, targetName: created.name, afterState: created, changedFields: ["created"], request });
      return created;
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "PARENT_INVALID") return NextResponse.json({ error: "Choose an active parent category." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "A category with that slug already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not create category." }, { status: 500 });
  }
}
