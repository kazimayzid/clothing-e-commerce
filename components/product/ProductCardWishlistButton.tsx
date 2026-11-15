"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import {
  getWishlistItems,
  publishWishlistFeedback,
  subscribeToActionChanges,
  toggleWishlistItem,
  type StoredWishlistEntry,
} from "@/contexts/actionStorage";

function isSameProduct(
  savedItem: StoredWishlistEntry,
  item: StoredWishlistEntry,
) {
  return (
    savedItem.id === item.id ||
    (Boolean(item.slug) && savedItem.slug === item.slug) ||
    savedItem.title === item.title
  );
}

export default function ProductCardWishlistButton({
  item,
}: {
  item: StoredWishlistEntry;
}) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const syncSavedState = () => {
      setIsSaved(getWishlistItems().some((saved) => isSameProduct(saved, item)));
    };

    syncSavedState();
    return subscribeToActionChanges(syncSavedState);
  }, [item]);

  function toggleSavedState() {
    const added = toggleWishlistItem(item);
    setIsSaved(added);
    publishWishlistFeedback(added);
  }

  return (
    <button
      type="button"
      aria-label={
        isSaved
          ? `Remove ${item.title} from wishlist`
          : `Add ${item.title} to wishlist`
      }
      aria-pressed={isSaved}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleSavedState();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className={`absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-transparent shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 ${
        isSaved ? "text-rose-600" : "text-neutral-600 hover:text-neutral-900"
      }`}
    >
      <Heart
        className={`size-[18px] transition-all duration-200 ${
          isSaved ? "fill-rose-600 stroke-rose-600" : "fill-transparent"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
