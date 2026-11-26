"use client";

import type { ColorOption } from "@/types/product";

interface ColorPickerProps {
  colors: ColorOption[];
  selectedColorName?: string;
  onSelect?: (color: ColorOption) => void;
}

export default function ColorPicker({ colors, selectedColorName, onSelect }: ColorPickerProps) {

  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-wider font-semibold text-black mb-2">
        Color:{" "}
        <span className="text-neutral-500 font-normal">
          {selectedColorName ?? "Not selected"}
        </span>
      </p>

      <div className="flex gap-2">
        {colors.map((color) => (
          <button
            key={color.hexCode}
            type="button"
            onClick={() => onSelect?.(color)}
            style={{ backgroundColor: color.hexCode }}
            aria-label={`Select ${color.name}`}
            className={`w-8 h-8 rounded-full border transition-all ${
              selectedColorName === color.name
                ? "ring-2 ring-offset-2 ring-black"
                : "border-neutral-300 opacity-75 hover:opacity-100"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
