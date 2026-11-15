"use client";

import Button from "../shared/Button";
import {
  toggleWishlistItem,
  type StoredWishlistEntry,
} from "@/contexts/actionStorage";

export default function Wishlist({ item }: { item: StoredWishlistEntry }) {
  return (
    <Button
      type="button"
      onClick={() => toggleWishlistItem(item)}
      className="bg-transparent border cursor-pointer border-neutral-300 hover:border-black text-neutral-700"
    >
      Save to Wishlist
    </Button>
  );
}
