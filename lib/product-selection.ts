import type { ProductVariantOption } from "@/types/product";

export function getVariantGallery(variant: Pick<ProductVariantOption, "images"> | undefined, commonImages: string[]) {
  return variant?.images.length ? variant.images : commonImages;
}

export function selectColorVariant(variants: ProductVariantOption[], colorName: string, currentSize?: string) {
  return variants.find((variant) => variant.isActive && variant.colorName === colorName && variant.size === currentSize)
    ?? variants.find((variant) => variant.isActive && variant.colorName === colorName);
}

export function selectSizeVariant(variants: ProductVariantOption[], size: string, currentColor?: string) {
  return variants.find((variant) => variant.isActive && variant.colorName === currentColor && variant.size === size)
    ?? variants.find((variant) => variant.isActive && variant.size === size);
}

export function getVariantUnitPrice(productPrice: string, priceOverride: string | null) {
  return priceOverride ?? productPrice;
}

export function getVariantCartLineId(productId: string, variantId: string) {
  return `${productId}:${variantId}`;
}
