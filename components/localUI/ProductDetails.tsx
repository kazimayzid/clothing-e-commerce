import type { ColorOption } from "@/types/product";
import Breadcrumbs from "../shared/Breadcrumbs";
import Ratings from "../shared/Ratings";
import PricingBox from "./PricingBox";
import ColorPicker from "./ColorPicker";
import SizePicker from "./SizePicker";
import BundleDeals from "./BundleDeals";

import ProductActions from "./ProductActions";

interface ProductDetailsProps {
  title?: string;
  price?: string;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  description?: string;
  colors?: ColorOption[];
  sizes?: string[];
}

export default function ProductDetails({
  title,
  price,
  originalPrice,
  rating,
  reviewCount,
  description,
  colors = [],
  sizes = [],
}: ProductDetailsProps) {
  // Price string হলে number এ convert করা হচ্ছে
  const numericPrice = Number(price ?? 0);

  // Original price safe করা হচ্ছে
  const numericOriginalPrice =
    originalPrice !== undefined ? Number(originalPrice) : undefined;

  return (
    <div className="flex flex-col">
      {/* Category / Breadcrumbs & Badge */}

      <Breadcrumbs />
      {/* Product Title */}
      <h1 className="text-3xl md:text-4xl font-serif text-black mb-2 tracking-tight">
        {title ?? "Product Name"}
      </h1>

      {/* Ratings */}
      <Ratings rating={rating ?? 0} reviewCount={reviewCount ?? 0} />

      {/* Pricing Box */}
      <PricingBox
        numericOriginalPrice={numericOriginalPrice ?? 0}
        numericPrice={numericPrice}
      />
      {/* Description */}
      <p className="text-neutral-600 text-sm leading-relaxed mb-4">
        {description ?? "No description available."}
      </p>

      {/* Color Picker */}

      <ColorPicker colors={colors} />
      {/* Size Picker */}

      <SizePicker sizes={sizes} />
      {/* Bundle Deals */}
      <BundleDeals numericPrice={numericPrice} />

      {/* Quantity & CTA */}
      <div className="flex flex-col gap-2.5">
        <ProductActions numericPrice={numericPrice} />
      </div>
    </div>
  );
}
