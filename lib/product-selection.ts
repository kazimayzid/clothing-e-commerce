import type { ProductVariantOption } from "@/types/product";

export function getVariantGallery(variant: Pick<ProductVariantOption, "images"> | undefined, commonImages: string[]) {
  return [...new Set([...commonImages, ...(variant?.images ?? [])])];
}

export function getInitialGalleryImage(
  variant: Pick<ProductVariantOption, "images" | "primaryImageSrc"> | undefined,
  commonImages: string[],
  commonPrimaryImageSrc?: string,
) {
  return commonPrimaryImageSrc ?? variant?.primaryImageSrc ?? commonImages[0] ?? variant?.images[0] ?? "";
}

export function getVariantGalleryFocus(
  variant: Pick<ProductVariantOption, "images" | "primaryImageSrc"> | undefined,
  commonImages: string[],
  commonPrimaryImageSrc?: string,
) {
  return variant?.primaryImageSrc ?? variant?.images[0] ?? commonPrimaryImageSrc ?? commonImages[0] ?? "";
}

export function selectColorVariant(variants: ProductVariantOption[], colorName: string, currentSize?: string) {
  return variants.find((variant) => variant.isActive && variant.colorName === colorName && (currentSize === undefined || variant.size === currentSize));
}

export function selectSizeVariant(variants: ProductVariantOption[], size: string, currentColor?: string) {
  return variants.find((variant) => variant.isActive && variant.colorName === currentColor && (currentColor === undefined || variant.size === size));
}

export function getVariantUnitPrice(productPrice: string, priceOverride: string | null) {
  return priceOverride ?? productPrice;
}

export function getVariantCartLineId(productId: string, variantId: string) {
  return `${productId}:${variantId}`;
}
