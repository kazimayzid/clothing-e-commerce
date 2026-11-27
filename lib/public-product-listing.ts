import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { ProductCardDTO } from "@/types/product";
import { getActiveCategoryIds, getDescendantCategoryIds } from "@/lib/category-tree";
import { getAllCategoryRecords } from "@/lib/product-category-service";
import { prisma } from "@/lib/prisma";

const productCardSelect = {
  id: true,
  title: true,
  slug: true,
  price: true,
  multibuyPrice: true,
  currency: true,
  gender: true,
  isNew: true,
  bestsellerRank: true,
  category: { select: { name: true } },
  images: {
    where: { deletedAt: null, variantId: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { secureUrl: true, isPrimary: true },
  },
  variants: {
    where: { isActive: true },
    orderBy: [{ name: "asc" }],
    select: {
      colorName: true,
      images: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: { secureUrl: true },
      },
    },
  },
} satisfies Prisma.ProductSelect;

type ProductCardRecord = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

function toPublicProductCard(product: ProductCardRecord): ProductCardDTO {
  const primary = product.images.find(({ isPrimary }) => isPrimary)?.secureUrl
    ?? product.images[0]?.secureUrl
    ?? product.variants[0]?.images[0]?.secureUrl
    ?? "";
  const colors = new Set(product.variants.map(({ colorName }) => colorName).filter(Boolean));
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: product.price.toFixed(2),
    multibuyPrice: product.multibuyPrice
      ? new Intl.NumberFormat("en-GB", { style: "currency", currency: product.currency.trim() }).format(Number(product.multibuyPrice.toFixed(2)))
      : undefined,
    currency: product.currency.trim(),
    gender: product.gender.toLowerCase() as ProductCardDTO["gender"],
    imageSrc: primary,
    colorName: product.variants[0]?.colorName ?? "",
    colorCount: colors.size,
    isNew: product.isNew,
    bestsellerRank: product.bestsellerRank ?? undefined,
    sellingFastCount: undefined,
    categoryName: product.category.name,
  };
}

export type PublicProductSort = "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

export type PublicProductListingInput = {
  categoryId?: string;
  categoryIds?: string[];
  includeDescendants?: boolean;
  gender?: "MEN" | "WOMEN" | "UNISEX" | "KIDS";
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: number;
  pageSize?: number;
  sort?: PublicProductSort;
};

export async function getPublicProductListing(input: PublicProductListingInput) {
  const categories = await getAllCategoryRecords();
  const visibleCategoryIds = getActiveCategoryIds(categories);
  const categoryIds = input.categoryIds
    ? input.categoryIds.filter((id) => visibleCategoryIds.has(id))
    : input.categoryId
    ? (input.includeDescendants === false ? [input.categoryId] : getDescendantCategoryIds(input.categoryId, categories))
      .filter((id) => visibleCategoryIds.has(id))
    : [...visibleCategoryIds];
  const clauses: Prisma.ProductWhereInput[] = [];
  if (input.gender) clauses.push({ OR: [{ gender: input.gender }, { gender: "UNISEX" }] });
  if (input.search) clauses.push({ OR: [
    { title: { contains: input.search, mode: "insensitive" } },
    { slug: { contains: input.search, mode: "insensitive" } },
    { tags: { has: input.search.toLowerCase() } },
  ] });
  const price = input.minPrice || input.maxPrice ? {
    ...(input.minPrice ? { gte: new Prisma.Decimal(input.minPrice) } : {}),
    ...(input.maxPrice ? { lte: new Prisma.Decimal(input.maxPrice) } : {}),
  } : undefined;
  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    categoryId: { in: categoryIds },
    ...(price ? { price } : {}),
    ...(clauses.length ? { AND: clauses } : {}),
  };
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 24;
  const sort = input.sort ?? "newest";
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = sort === "price_asc"
    ? [{ price: "asc" }, { id: "asc" }]
    : sort === "price_desc"
      ? [{ price: "desc" }, { id: "asc" }]
      : sort === "name_asc"
        ? [{ title: "asc" }, { id: "asc" }]
        : sort === "name_desc"
          ? [{ title: "desc" }, { id: "asc" }]
          : [{ createdAt: sort === "oldest" ? "asc" : "desc" }, { id: "asc" }];
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, select: productCardSelect, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return {
    products: products.map(toPublicProductCard),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}
