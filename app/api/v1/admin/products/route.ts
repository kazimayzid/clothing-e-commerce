import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { hasPermission, requireAdminApiPermission } from "@/lib/admin-access";
import { adminProductInclude, toAdminProductDTO } from "@/lib/product-data";
import { canSetVariantStock, createProductSchema } from "@/lib/product-validation";
import { getDescendantCategoryIds, isActiveCategoryPath, resolveCategoryPath } from "@/lib/category-tree";
import { z } from "zod";

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).optional(),
  category: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "ALL"]).default("ALL"),
  availability: z.enum(["IN_STOCK", "OUT_OF_STOCK"]).optional(),
  minPrice: z.string().regex(/^\d{1,8}(?:\.\d{1,2})?$/).optional(),
  maxPrice: z.string().regex(/^\d{1,8}(?:\.\d{1,2})?$/).optional(),
  sort: z.enum(["name", "price", "createdAt"]).default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: Request) {
  const authorization = await requireAdminApiPermission("products:read");
  if ("response" in authorization) return authorization.response;
  const { searchParams } = new URL(request.url);
  const parsed = listSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Product filters are invalid." }, { status: 400 });
  const filters = parsed.data;
  const categoryRecords = filters.category ? await prisma.productCategory.findMany({ select: { id: true, name: true, slug: true, description: true, parentId: true, archivedAt: true } }) : [];
  const categoryIds = filters.category ? getDescendantCategoryIds(filters.category, categoryRecords).filter((id) => isActiveCategoryPath(id, categoryRecords)) : [];
  if (filters.minPrice && filters.maxPrice && new Prisma.Decimal(filters.minPrice).gt(filters.maxPrice)) {
    return NextResponse.json({ error: "Minimum price cannot exceed maximum price." }, { status: 400 });
  }
  const stockFilter: Prisma.ProductWhereInput["variants"] = filters.availability === "IN_STOCK"
    ? { some: { isActive: true, stockQuantity: { gt: 0 } } }
    : filters.availability === "OUT_OF_STOCK"
      ? { none: { isActive: true, stockQuantity: { gt: 0 } } }
      : undefined;
  const where: Prisma.ProductWhereInput = {
    ...(filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(filters.category ? { categoryId: { in: categoryIds } } : {}),
    ...(filters.q ? { OR: [
      { title: { contains: filters.q, mode: "insensitive" } },
      { slug: { contains: filters.q, mode: "insensitive" } },
      { variants: { some: { sku: { contains: filters.q, mode: "insensitive" } } } },
    ] } : {}),
    ...(filters.minPrice || filters.maxPrice ? { price: {
      ...(filters.minPrice ? { gte: new Prisma.Decimal(filters.minPrice) } : {}),
      ...(filters.maxPrice ? { lte: new Prisma.Decimal(filters.maxPrice) } : {}),
    } } : {}),
    ...(stockFilter ? { variants: stockFilter } : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = filters.sort === "name"
    ? [{ title: filters.direction }, { id: "asc" }]
    : filters.sort === "price"
      ? [{ price: filters.direction }, { id: "asc" }]
      : [{ createdAt: filters.direction }, { id: "asc" }];

  const [products, total, categories, totalProducts, activeProducts, draftProducts, archivedProducts, outOfStockProducts] = await Promise.all([
    prisma.product.findMany({ where, include: adminProductInclude, orderBy, skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize }),
    prisma.product.count({ where }),
    prisma.productCategory.findMany({ select: { id: true, name: true, slug: true, description: true, parentId: true, archivedAt: true }, orderBy: { name: "asc" } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.product.count({ where: { status: "ARCHIVED" } }),
    prisma.product.count({ where: { status: "PUBLISHED", variants: { none: { isActive: true, stockQuantity: { gt: 0 } } } } }),
  ]);

  return NextResponse.json({
    products: products.map(toAdminProductDTO),
    categories: categories.filter(({ id }) => isActiveCategoryPath(id, categories)).map((category) => ({ ...category, path: resolveCategoryPath(category.id, categories) ?? [] })),
    pagination: { page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.ceil(total / filters.pageSize) },
    stats: { total: totalProducts, active: activeProducts, drafts: draftProducts, archived: archivedProducts, outOfStock: outOfStockProducts },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const authorization = await requireAdminApiPermission("products:create");
  if ("response" in authorization) return authorization.response;
  const parsed = createProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Product details are invalid.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const input = parsed.data;
  const mayAdjustInventory = hasPermission(authorization.context, "inventory:adjust");
  if (input.variants.some(({ stockQuantity }) => !canSetVariantStock(mayAdjustInventory, stockQuantity))) {
    return NextResponse.json({ error: "Initial stock requires inventory:adjust permission." }, { status: 403 });
  }
  const allImages = [...input.images, ...input.variants.flatMap(({ images }) => images ?? [])];
  const imageIds = [...new Set(allImages.map(({ id }) => id))];
  if (imageIds.length !== allImages.length) return NextResponse.json({ error: "An image cannot be assigned to more than one gallery." }, { status: 400 });
  const primaryImageId = input.primaryImageId ?? imageIds[0] ?? null;

  try {
    const product = await prisma.$transaction(async (tx) => {
      const categoryRecords = await tx.productCategory.findMany({ select: { id: true, parentId: true, archivedAt: true, name: true, slug: true, description: true } });
      if (!isActiveCategoryPath(input.categoryId, categoryRecords)) throw new Error("CATEGORY_INVALID");
      const stagedImages = imageIds.length ? await tx.productImage.findMany({
        where: { id: { in: imageIds }, productId: null, uploadedById: authorization.context.userId, deletedAt: null },
        select: { id: true },
      }) : [];
      if (stagedImages.length !== imageIds.length) throw new Error("IMAGE_OWNERSHIP_INVALID");
      const created = await tx.product.create({
        data: {
          title: input.title,
          slug: input.slug,
          description: input.description,
          detailsAndCare: input.detailsAndCare,
          gender: input.gender,
          categoryId: input.categoryId,
          price: new Prisma.Decimal(input.price),
          multibuyPrice: input.multibuyPrice ? new Prisma.Decimal(input.multibuyPrice) : null,
          currency: input.currency,
          status: input.status,
          tags: input.tags,
          isNew: input.isNew,
          bestsellerRank: input.bestsellerRank,
          createdById: authorization.context.userId,
        },
        select: { id: true, title: true, slug: true, status: true, price: true, currency: true },
      });
      for (const [sortOrder, image] of input.images.entries()) {
        await tx.productImage.update({ where: { id: image.id }, data: {
          productId: created.id,
          variantId: null,
          sortOrder,
          isPrimary: image.id === primaryImageId,
          altText: image.altText || input.title,
        } });
      }
      for (const variant of input.variants) {
        const createdVariant = await tx.productVariant.create({
          data: {
            productId: created.id,
            name: variant.name,
            sku: variant.sku?.trim().toUpperCase() || null,
            size: variant.size || null,
            colorName: variant.colorName || null,
            colorHex: variant.colorHex || null,
            priceOverride: variant.priceOverride ? new Prisma.Decimal(variant.priceOverride) : null,
            stockQuantity: mayAdjustInventory ? variant.stockQuantity ?? 0 : 0,
            isActive: variant.isActive ?? true,
          },
          select: { id: true },
        });
        for (const [sortOrder, image] of (variant.images ?? []).entries()) {
          await tx.productImage.update({ where: { id: image.id }, data: {
            productId: created.id,
            variantId: createdVariant.id,
            sortOrder,
            isPrimary: image.id === (variant.primaryImageId ?? variant.images?.[0]?.id),
            altText: image.altText || `${input.title} ${variant.colorName || variant.name}`,
          } });
        }
      }
      await appendAdminAuditLog(tx, {
        actor: authorization.context,
        action: "products.created",
        category: "PRODUCT",
        riskLevel: "MEDIUM",
        description: `Created product ${created.title}.`,
        targetType: "PRODUCT",
        targetId: created.id,
        targetName: created.title,
        afterState: { ...created, price: created.price.toFixed(2), imageIds, variantCount: input.variants.length },
        changedFields: ["created"],
        request,
      });
      return tx.product.findUniqueOrThrow({ where: { id: created.id }, include: adminProductInclude });
    });
    return NextResponse.json({ product: toAdminProductDTO(product) }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "IMAGE_OWNERSHIP_INVALID") return NextResponse.json({ error: "One or more uploaded images are invalid or no longer available." }, { status: 400 });
    if (error instanceof Error && error.message === "CATEGORY_INVALID") return NextResponse.json({ error: "Choose an existing category whose full parent path is active." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "A product with this slug or SKU already exists." }, { status: 409 });
    console.error("Product creation failed", error);
    return NextResponse.json({ error: "Could not create the product." }, { status: 500 });
  }
}
