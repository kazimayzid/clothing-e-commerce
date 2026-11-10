"use client";

import Button from "../shared/Button";
import { toggleWishlistItem } from "@/contexts/actionStorage";

export default function Wishlist({ title = "Product" }: { title?: string }) {
    return (
        <Button
            type="button"
            onClick={() => toggleWishlistItem({
                id: title.trim().toLowerCase().replace(/\s+/g, "-"),
                title,
            })}
            className="bg-transparent border cursor-pointer border-neutral-300 hover:border-black text-neutral-700"
        >Save to Wishlist</Button>
    )
}
