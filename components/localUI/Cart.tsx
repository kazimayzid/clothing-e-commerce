
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCartItems, subscribeToActionChanges } from "@/contexts/actionStorage";

export default function CartButton() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const updateCount = () => setItemCount(getCartItems().reduce((total, item) => total + item.quantity, 0));
    updateCount();
    return subscribeToActionChanges(updateCount);
  }, []);

  return (
    <Link
      href="/cart"
      aria-label={`Shopping bag${itemCount ? `, ${itemCount} items` : ""}`}
      className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white/80 shadow-xs transition-all duration-200 hover:scale-110 hover:bg-white active:scale-90 focus:outline-none"
    >
      <ShoppingBag className="h-4 w-4 transition-all duration-200 fill-transparent stroke-neutral-600 group-hover:stroke-black" />

      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white transition-transform duration-200 group-hover:scale-105">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
