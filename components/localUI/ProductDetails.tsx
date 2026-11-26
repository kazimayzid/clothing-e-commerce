"use client";

import type { ColorOption, ProductVariantOption } from "@/types/product";
import Breadcrumbs from "../shared/Breadcrumbs";
import Ratings from "../shared/Ratings";
import PricingBox from "./PricingBox";
import ColorPicker from "./ColorPicker";
import SizePicker from "./SizePicker";
import ProductActions from "./ProductActions";

interface ProductDetailsProps {
  id: string;
  slug: string;
  imageSrc: string;
  title: string;
  price: string;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  colors?: ColorOption[];
  sizes?: string[];
  variants: ProductVariantOption[];
  selectedVariant?: ProductVariantOption;
  selectedColorName?: string;
  selectedSize?: string;
  categoryPath: { id: string; name: string; slug: string }[];
  onSelectColor: (color: ColorOption) => void;
  onSelectSize: (size: string) => void;
}

export default function ProductDetails({
  id, slug, imageSrc, title, price, currency = "GBP", rating, reviewCount,
  description, colors = [], sizes = [], variants, selectedVariant, selectedColorName, selectedSize, categoryPath, onSelectColor, onSelectSize,
}: ProductDetailsProps) {
  const numericPrice = Number(selectedVariant?.price ?? price);
  const available = Boolean(selectedVariant?.isActive && selectedVariant.stockQuantity > 0);
  const selectedOptions = {
    ...(selectedVariant?.colorName ? { color: selectedVariant.colorName } : {}),
    ...(selectedVariant?.size ? { size: selectedVariant.size } : {}),
  };

  return (
    <div className="flex flex-col">
      <Breadcrumbs items={categoryPath} currentLabel={title} />
      <h1 className="mb-2 font-serif text-3xl tracking-tight text-black md:text-4xl">{title}</h1>
      <Ratings rating={rating ?? 0} reviewCount={reviewCount ?? 0} />
      <PricingBox numericOriginalPrice={0} numericPrice={numericPrice} currency={currency} />
      <p className="mb-4 text-sm leading-relaxed text-neutral-600">{description ?? "No description available."}</p>
      <ColorPicker colors={colors} selectedColorName={selectedColorName ?? selectedVariant?.colorName ?? undefined} onSelect={onSelectColor} />
      <SizePicker sizes={sizes} selectedSize={selectedSize ?? selectedVariant?.size ?? undefined} onSelect={onSelectSize} />
      {!selectedVariant && variants.length > 0 && <p className="mb-3 text-sm text-red-700">This color and size combination is unavailable.</p>}
      {selectedVariant && <div className="mb-4 space-y-1 text-xs text-neutral-600">
        {selectedVariant.sku && <p>SKU: <span className="font-mono text-neutral-900">{selectedVariant.sku}</span></p>}
        <p className={available ? "text-emerald-700" : "text-red-700"}>
          {available ? `${selectedVariant.stockQuantity} available` : "Currently unavailable"}
        </p>
      </div>}
      <div className="flex flex-col gap-2.5">
        <ProductActions
          key={selectedVariant?.id ?? "no-selected-variant"}
          id={id}
          slug={slug}
          numericPrice={numericPrice}
          title={title}
          imageSrc={imageSrc}
          variant={selectedVariant?.name ?? "Standard"}
          variantId={selectedVariant?.id}
          sku={selectedVariant?.sku ?? undefined}
          selectedOptions={selectedOptions}
          stockQuantity={selectedVariant?.stockQuantity ?? 0}
          currency={currency}
          available={available}
        />
      </div>
      {!variants.length && <p className="mt-2 text-[11px] text-neutral-500">No purchasable variants are configured.</p>}
    </div>
  );
}
