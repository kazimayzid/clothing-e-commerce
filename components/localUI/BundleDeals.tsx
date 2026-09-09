"use client";
import { useState } from "react";

export default function BundleDeals({numericPrice}: {numericPrice: number}) {
 
      const [bundleOption, setBundleOption] = useState<"single" | "bundle">(
    "single",
  );

    const bundlePrice = numericPrice * 2 * 0.9;
    return (
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
            <span className="text-xs font-bold">Buy 2 (Extra 10% Off)</span>

            <span className="text-xs font-semibold mt-1">
              ${(bundlePrice / 2).toFixed(2)} /ea
            </span>
          </button>
        </div>
      </div>

    )
}