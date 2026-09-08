"use client";

import { useState } from "react";
import type { ColorOption } from "@/types/product";

interface ColorPickerProps {
  colors: ColorOption[];
}

export default function ColorPicker({ colors }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<ColorOption | undefined>(
    colors[0]
  );

  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-wider font-semibold text-black mb-2">
        Color:{" "}
        <span className="text-neutral-500 font-normal">
          {selectedColor?.name ?? "Not selected"}
        </span>
      </p>

      <div className="flex gap-2">
        {colors.map((color) => (
          <button
            key={color.hexCode}
            type="button"
            onClick={() => setSelectedColor(color)}
            style={{ backgroundColor: color.hexCode }}
            aria-label={`Select ${color.name}`}
            className={`w-8 h-8 rounded-full border transition-all ${
              selectedColor?.hexCode === color.hexCode
                ? "ring-2 ring-offset-2 ring-black"
                : "border-neutral-300 opacity-75 hover:opacity-100"
            }`}
          />
        ))}
      </div>
    </div>
  );
}