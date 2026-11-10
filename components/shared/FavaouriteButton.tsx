"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getWishlistItems, subscribeToActionChanges } from "@/contexts/actionStorage";

export default function FavoriteButton() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const updateCount = () => setItemCount(getWishlistItems().length);
    updateCount();
    return subscribeToActionChanges(updateCount);
  }, []);

  return (
    <Link
      href="/account?tab=wishlist"
      aria-label={`Wishlist${itemCount ? `, ${itemCount} saved items` : ""}`}
      className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white/80 shadow-xs transition-all duration-200 hover:scale-110 hover:bg-white active:scale-90 focus:outline-none"
    >
      <Heart className="h-4 w-4 fill-transparent stroke-neutral-600 transition-all duration-200 group-hover:stroke-black" />
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
