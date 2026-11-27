import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { buildCategoryTree, isActiveCategoryPath, resolveCategoryPath } from "@/lib/category-tree";
import { createProductCategorySchema } from "@/lib/product-validation";
import { revalidatePublicCategoryData } from "@/lib/product-category-service";

export async function GET() {
  try {
    const authorization = await requireAdminApiPermission("products:read");
    if ("response" in authorization) return authorization.response;
    const [categories, counts] = await Promise.all([
      prisma.productCategory.findMany({ orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }, { id: "asc" }] }),
      prisma.product.groupBy({ by: ["categoryId"], _count: { _all: true } }),
    ]);
    const records = categories.map(({ id, name, slug, description, parentId, archivedAt, sortOrder }) => ({ id, name, slug, description, parentId, archivedAt, sortOrder }));
    const countById = new Map(counts.map(({ categoryId, _count }) => [categoryId, _count._all]));
    return NextResponse.json({ categories: buildCategoryTree(records, true), flatCategories: records.map((category) => ({
      ...category,
      path: resolveCategoryPath(category.id, records) ?? [],
      productCount: countById.get(category.id) ?? 0,
      childCount: records.filter(({ parentId }) => parentId === category.id).length,
    })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    logCategoryDatabaseError("list", error);
    return NextResponse.json({ error: getCategoryDatabaseErrorMessage(error, "Could not load categories.") }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
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
      const created = await tx.productCategory.create({ data: { name: input.name, slug: input.slug, description: input.description ?? null, parentId: input.parentId ?? null, sortOrder: input.sortOrder ?? 0 } });
      await appendAdminAuditLog(tx, { actor: authorization.context, action: "product_categories.created", category: "PRODUCT", riskLevel: "MEDIUM", description: `Created product category ${created.name}.`, targetType: "PRODUCT_CATEGORY", targetId: created.id, targetName: created.name, afterState: created, changedFields: ["created"], request });
      return created;
    });
    revalidatePublicCategoryData();
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    logCategoryDatabaseError("create", error);
    if (error instanceof Error && error.message === "PARENT_INVALID") return NextResponse.json({ error: "Choose an active parent category." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "A category with that slug already exists." }, { status: 409 });
    return NextResponse.json({ error: getCategoryDatabaseErrorMessage(error, "Could not create category.") }, { status: 500 });
  }
}

function getCategoryDatabaseErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
    const modelName = typeof error.meta?.modelName === "string" ? error.meta.modelName : undefined;
    const column = typeof error.meta?.column === "string" ? error.meta.column : undefined;
    if (modelName && column) return `The database is missing column “${column}” required by ${modelName}. Check the server log before changing the schema.`;
    if (column) return `The database is missing column “${column}”. Check the server log before changing the schema.`;
    return "Prisma reported a missing database column (P2022). Check the server log for model and column metadata.";
  }
  return fallback;
}

function logCategoryDatabaseError(operation: "list" | "create", error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`Admin category ${operation} failed`, {
      code: error.code,
      meta: error.meta,
      message: error.message,
      clientVersion: error.clientVersion,
    });
    return;
  }
  console.error(`Admin category ${operation} failed`, error);
}
