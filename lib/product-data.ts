import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { Product, ProductCardDTO } from "@/types/product";

export const adminProductInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: {
    where: { deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, secureUrl: true, altText: true, sortOrder: true, isPrimary: true },
  },
  variants: {
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, sku: true, size: true, colorName: true, colorHex: true, priceOverride: true, stockQuantity: true, isActive: true },
  },
} satisfies Prisma.ProductInclude;

export type AdminProductRecord = Prisma.ProductGetPayload<{ include: typeof adminProductInclude }>;

export function toAdminProductDTO(product: AdminProductRecord) {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    detailsAndCare: product.detailsAndCare,
    gender: product.gender,
    category: product.category,
    price: product.price.toFixed(2),
    multibuyPrice: product.multibuyPrice?.toFixed(2) ?? null,
    currency: product.currency.trim(),
    status: product.status,
    tags: product.tags,
    isNew: product.isNew,
    bestsellerRank: product.bestsellerRank,
    stockCount: product.variants.filter(({ isActive }) => isActive).reduce((total, variant) => total + variant.stockQuantity, 0),
    images: product.images,
    variants: product.variants.map((variant) => ({
      ...variant,
      priceOverride: variant.priceOverride?.toFixed(2) ?? null,
    })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    archivedAt: product.archivedAt?.toISOString() ?? null,
  };
}

function currencyAmount(value: Prisma.Decimal, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.trim() }).format(Number(value.toFixed(2)));
}

export function toStorefrontProduct(product: AdminProductRecord): Product {
  const colors = [...new Map(product.variants.filter((variant) => variant.isActive && variant.colorName).map((variant) => [variant.colorName, {
    name: variant.colorName!,
    hexCode: variant.colorHex ?? "#808080",
  }])).values()];
  const sizes = [...new Set(product.variants.filter(({ isActive, size }) => isActive && size).map(({ size }) => size!))];
  const images = product.images.map(({ secureUrl }) => secureUrl);
  const firstVariant = product.variants.find(({ isActive }) => isActive);
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: product.price.toFixed(2),
    multibuyPrice: product.multibuyPrice ? currencyAmount(product.multibuyPrice, product.currency) : undefined,
    currency: product.currency.trim(),
    gender: product.gender.toLowerCase() as Product["gender"],
    categoryId: product.categoryId,
    categoryName: product.category.name,
    tags: product.tags,
    imageSrc: images[0] ?? "",
    images,
    colorName: firstVariant?.colorName ?? "",
    colors,
    sizes,
    description: product.description,
    detailsAndCare: product.detailsAndCare,
    stockCount: product.variants.filter(({ isActive }) => isActive).reduce((total, variant) => total + variant.stockQuantity, 0),
    isNew: product.isNew,
    bestsellerRank: product.bestsellerRank ?? undefined,
  };
}

export function toProductCardDTO(product: AdminProductRecord): ProductCardDTO {
  const first = toStorefrontProduct(product);
  return {
    id: first.id,
    title: first.title,
    slug: first.slug,
    price: first.price,
    multibuyPrice: first.multibuyPrice,
    currency: first.currency,
    gender: first.gender,
    imageSrc: first.imageSrc,
    colorName: first.colorName,
    colorCount: first.colors?.length ?? 0,
    isNew: first.isNew,
    bestsellerRank: first.bestsellerRank,
    sellingFastCount: undefined,
    categoryName: first.categoryName,
  };
}
