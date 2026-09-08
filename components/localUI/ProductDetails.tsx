
"use client";

import type { ColorOption } from "@/types/product";
import { useState } from "react";
import Breadcrumbs from "../shared/Breadcrumbs";
import Ratings from "../shared/Ratings";
import PricingBox from "./PricingBox";
import ColorPicker from "./ColorPicker";

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
  // নির্বাচিত Color
  const [selectedColor, setSelectedColor] = useState<ColorOption | undefined>(
    colors[0]
  );

  // নির্বাচিত Size
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    sizes[0]
  );

  const [bundleOption, setBundleOption] = useState<"single" | "bundle">(
    "single"
  );

  const [quantity, setQuantity] = useState(1);

  // Price string হলে number এ convert করা হচ্ছে
  const numericPrice = Number(price ?? 0);

  // Original price safe করা হচ্ছে
  const numericOriginalPrice =
    originalPrice !== undefined ? Number(originalPrice) : undefined;

  // Bundle price (Buy 2 = 10% off)
  const bundlePrice = numericPrice * 2 * 0.9;

  return (
    <div className="flex flex-col">
      {/* Category / Breadcrumbs & Badge */}
      
     <Breadcrumbs/>
      {/* Product Title */}
      <h1 className="text-3xl md:text-4xl font-serif text-black mb-2 tracking-tight">
        {title ?? "Product Name"}
      </h1>

      {/* Ratings */}
      <Ratings rating={rating ?? 0} reviewCount={reviewCount ?? 0}/>

      {/* Pricing Box */}
      <PricingBox numericOriginalPrice={numericOriginalPrice ?? 0} numericPrice={numericPrice}/>
      {/* Description */}
      <p className="text-neutral-600 text-sm leading-relaxed mb-4">
        {description ?? "No description available."}
      </p>

      {/* Color Picker */}
      
<ColorPicker colors={colors}/>
      {/* Size Picker */}
      {sizes.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs uppercase tracking-wider font-semibold text-black">
              Size
            </p>

            <button
              type="button"
              className="text-xs text-neutral-500 hover:text-black underline"
            >
              Size Guide
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`py-2.5 px-3 border text-xs font-medium transition-all ${
                  selectedSize === size
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-black"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bundle Deals */}
      <div className="mb-4 bg-neutral-50 p-3 border border-neutral-200">
        <p className="text-xs font-bold uppercase tracking-wider text-black mb-2 flex justify-between">
          <span>Bundle &amp; Save</span>

          <span className="text-emerald-700 lowercase font-medium">
            Applied at checkout
          </span>
        </p>

        <div className="grid grid-cols-2 gap-2">
          {/* Single */}
          <button
            type="button"
            onClick={() => setBundleOption("single")}
            className={`p-2 border cursor-pointer flex flex-col justify-between text-left ${
              bundleOption === "single"
                ? "border-black bg-white"
                : "border-neutral-200 bg-white/50"
            }`}
          >
            <span className="text-xs font-bold">Buy 1 (Single)</span>

            <span className="text-xs font-semibold mt-1">
              ${numericPrice.toFixed(2)}
            </span>
          </button>

          {/* Bundle */}
          <button
            type="button"
            onClick={() => setBundleOption("bundle")}
            className={`p-2 border cursor-pointer flex flex-col justify-between text-left ${
              bundleOption === "bundle"
                ? "border-black bg-white"
                : "border-neutral-200 bg-white/50"
            }`}
          >
            <span className="text-xs font-bold">
              Buy 2 (Extra 10% Off)
            </span>

            <span className="text-xs font-semibold mt-1">
              ${(bundlePrice / 2).toFixed(2)} /ea
            </span>
          </button>
        </div>
      </div>

      {/* Quantity & CTA */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-semibold text-black tracking-wider">
            Qty:
          </span>

          <div className="flex items-center border border-neutral-300 bg-white">
            <button
              type="button"
              onClick={() =>
                setQuantity((currentQuantity) =>
                  Math.max(1, currentQuantity - 1)
                )
              }
              className="px-3 py-1 text-neutral-600 hover:text-black font-bold"
            >
              −
            </button>

            <span className="px-3 text-xs font-bold">{quantity}</span>

            <button
              type="button"
              onClick={() =>
                setQuantity((currentQuantity) => currentQuantity + 1)
              }
              className="px-3 py-1 text-neutral-600 hover:text-black font-bold"
            >
              +
            </button>
          </div>

          <span className="text-[11px] text-emerald-700 font-medium">
            In Stock &amp; Ready to Ship
          </span>
        </div>

        {/* Add to Bag */}
        <button
          type="button"
          className="w-full bg-[#0F172A] hover:bg-black text-white py-3.5 text-xs font-bold uppercase tracking-widest transition-all"
        >
          Add to Bag — $
          {(numericPrice * quantity).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </button>

        {/* Buy Now */}
        <button
          type="button"
          className="w-full bg-amber-400 hover:bg-amber-300 text-black py-3.5 text-xs font-bold uppercase tracking-widest border border-amber-500"
        >
          Buy Now with 1-Click
        </button>

        {/* Wishlist */}
        <button
          type="button"
          className="w-full bg-transparent border border-neutral-300 py-2.5 text-xs uppercase tracking-widest hover:border-black text-neutral-700"
        >
          Save to Wishlist
        </button>
      </div>
    </div>
  );
}

