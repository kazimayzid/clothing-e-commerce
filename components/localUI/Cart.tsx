
import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function CartButton() {
  const itemCount = 1; // Change to 0 to hide badge

  return (
    <button
      aria-label="Shopping Bag"
      className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs border border-black/5 shadow-xs transition-all duration-200 hover:bg-white hover:scale-110 active:scale-90 focus:outline-none"
    >
      <ShoppingBag className="h-4 w-4 transition-all duration-200 fill-transparent stroke-neutral-600 group-hover:stroke-black" />

      {/* Counter Badge */}
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white transition-transform duration-200 group-hover:scale-105">
          {itemCount}
        </span>
      )}
    </button>
  );
}