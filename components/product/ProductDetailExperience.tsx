"use client";

import { useMemo, useState } from "react";
import ProductGallery from "@/components/shared/ProductGallery";
import ProductDetails from "@/components/localUI/ProductDetails";
import type { ColorOption, ProductVariantOption } from "@/types/product";
import type { ProductDetailDTO } from "@/types/productDetails";
import { getVariantGallery, selectColorVariant, selectSizeVariant } from "@/lib/product-selection";

const EMPTY_VARIANTS: ProductVariantOption[] = [];

export default function ProductDetailExperience({ product }: { product: ProductDetailDTO }) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id);
  const [selectedColorName, setSelectedColorName] = useState(product.variants?.[0]?.colorName ?? undefined);
  const [selectedSize, setSelectedSize] = useState(product.variants?.[0]?.size ?? undefined);
  const variants = product.variants ?? EMPTY_VARIANTS;
  const selectedVariant = variants.find(({ id }) => id === selectedVariantId);
  const colors = useMemo(() => [...new Map(variants.filter(({ colorName }) => colorName).map((variant) => [variant.colorName!, {
    name: variant.colorName!,
    hexCode: variant.colorHex ?? "#808080",
  }])).values()], [variants]);
  const availableSizes = useMemo(() => [...new Set(variants.filter((variant) =>
    variant.isActive && variant.colorName === selectedColorName && variant.size,
  ).map((variant) => variant.size!))], [variants, selectedColorName]);
  const commonImages = product.commonImages ?? product.images;
  const selectedImages = getVariantGallery(selectedVariant, commonImages);
  const initialImageSrc = selectedVariant?.primaryImageSrc ?? selectedVariant?.images[0] ?? product.commonPrimaryImageSrc ?? selectedImages[0];

  function chooseColor(color: ColorOption) {
    setSelectedColorName(color.name);
    const next = selectColorVariant(variants, color.name, selectedSize);
    setSelectedVariantId(next?.id);
  }

  function chooseSize(size: string) {
    setSelectedSize(size);
    const next = selectSizeVariant(variants, size, selectedColorName);
    setSelectedVariantId(next?.id);
  }

  return (
    <>
      <ProductGallery key={`${selectedImages.join("|")}:${initialImageSrc}`} images={selectedImages} title={product.title} initialImageSrc={initialImageSrc} />
      <ProductDetails
        id={product.id}
        slug={product.slug}
        imageSrc={initialImageSrc ?? selectedImages[0] ?? ""}
        title={product.title}
        price={product.price}
        currency={product.currency}
        rating={product.rating}
        reviewCount={product.reviewCount}
        description={product.description}
        colors={colors.length ? colors : product.colors}
        sizes={availableSizes.length ? availableSizes : product.sizes}
        variants={variants}
        selectedVariant={selectedVariant}
        selectedColorName={selectedColorName}
        selectedSize={selectedSize}
        categoryPath={product.categoryPath ?? []}
        onSelectColor={chooseColor}
        onSelectSize={chooseSize}
      />
      {variants.length > 1 && <div className="sr-only" aria-live="polite">
        {selectedVariant ? `Selected ${selectedVariant.colorName ?? ""} ${selectedVariant.size ?? ""}` : ""}
      </div>}
    </>
  );
}
