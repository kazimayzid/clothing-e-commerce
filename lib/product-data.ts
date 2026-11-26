import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { Product, ProductCardDTO } from "@/types/product";
import { getVariantUnitPrice } from "@/lib/product-selection";

export const adminProductInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, secureUrl: true, altText: true, sortOrder: true, isPrimary: true, variantId: true },
  },
  variants: {
    orderBy: [{ name: "asc" }],
    include: {
      images: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, secureUrl: true, altText: true, sortOrder: true, isPrimary: true, variantId: true },
      },
    },
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
    images: product.images.filter(({ variantId }) => variantId === null),
    variants: product.variants.map((variant) => ({
      ...variant,
      images: variant.images,
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
  const commonImages = product.images.filter(({ variantId }) => variantId === null);
  const firstVariant = product.variants.find(({ isActive }) => isActive);
  const initialGallery = firstVariant?.images.length ? firstVariant.images : commonImages;
  const images = initialGallery.map(({ secureUrl }) => secureUrl);
  const primaryImage = initialGallery.find(({ isPrimary }) => isPrimary) ?? initialGallery[0];
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
    imageSrc: primaryImage?.secureUrl ?? "",
    images,
    commonImages: commonImages.map(({ secureUrl }) => secureUrl),
    commonPrimaryImageSrc: commonImages.find(({ isPrimary }) => isPrimary)?.secureUrl ?? commonImages[0]?.secureUrl,
    colorName: firstVariant?.colorName ?? "",
    colors,
    sizes,
    description: product.description,
    detailsAndCare: product.detailsAndCare,
    stockCount: product.variants.filter(({ isActive }) => isActive).reduce((total, variant) => total + variant.stockQuantity, 0),
    isNew: product.isNew,
    bestsellerRank: product.bestsellerRank ?? undefined,
    variants: product.variants.filter(({ isActive }) => isActive).map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      size: variant.size,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      price: getVariantUnitPrice(product.price.toFixed(2), variant.priceOverride?.toFixed(2) ?? null),
      stockQuantity: variant.stockQuantity,
      isActive: variant.isActive,
      images: variant.images.map(({ secureUrl }) => secureUrl),
      primaryImageSrc: variant.images.find(({ isPrimary }) => isPrimary)?.secureUrl ?? variant.images[0]?.secureUrl,
    })),
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
