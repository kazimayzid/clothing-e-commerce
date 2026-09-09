"use client";

import { useState } from "react";

interface SizePickerProps {
  sizes: string[];
}

export default function SizePicker({ sizes }: SizePickerProps) {
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    sizes[0]
  );

  if (sizes.length === 0) {
    return null;
  }

  return (
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
  );
}