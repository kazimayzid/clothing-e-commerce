"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Heart, ShoppingBag, Trash2 } from "lucide-react";
import AccountEmptyState from "@/components/account/AccountEmptyState";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { formatAccountPrice, mockWishlistProducts } from "@/lib/mock-data/customer-account";

export default function WishlistClient() {
  const [items, setItems] = useState(mockWishlistProducts);
  const [notice, setNotice] = useState("");

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setNotice("Removed from your preview wishlist.");
  }

  return (
    <>
      <AccountPageHeader title="My Wishlist" description="A considered edit of the pieces you’ve saved for later." aside={<span className="inline-flex items-center gap-2 text-xs text-stone-500"><Heart className="size-4 text-[#a88238]" />{items.length} {items.length === 1 ? "saved piece" : "saved pieces"}</span>} />
      {notice && <p role="status" className="mb-4 border border-stone-200 bg-white px-4 py-3 text-xs text-stone-600">{notice}</p>}
      {items.length === 0 ? (
        <AccountEmptyState kind="wishlist" title="Your wishlist is waiting for something special." description="Save the pieces you love and they’ll be gathered here for you." actionLabel="Continue shopping" actionHref="/shop" />
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="group min-w-0">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f1efeb]">
                <Link href={`/products/${item.slug}`} aria-label={`View ${item.name}`} className="absolute inset-0">
                  <Image src={item.imageSrc} alt={item.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 30vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.025]" />
                </Link>
                <span className={`absolute left-3 top-3 border px-2.5 py-1 text-[9px] font-medium ${item.availability === "Unavailable" ? "border-stone-300 bg-white/90 text-stone-500" : item.availability === "Low stock" ? "border-amber-200 bg-amber-50/95 text-amber-800" : "border-white/70 bg-white/90 text-stone-600"}`}>{item.availability}</span>
                <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name} from wishlist`} className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/95 text-stone-600 transition hover:bg-white hover:text-rose-700 focus-visible:outline-2"><Trash2 className="size-4" /></button>
              </div>
              <div className="pt-3">
                <Link href={`/products/${item.slug}`} className="text-sm font-medium text-stone-900 hover:underline">{item.name}</Link>
                <p className="mt-1 text-[10px] text-stone-500">{item.variant}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="font-medium text-stone-900">{formatAccountPrice(item.unitPrice)}</span>
                  {item.previousPrice && <span className="text-stone-400 line-through">{formatAccountPrice(item.previousPrice)}</span>}
                </div>
                <button type="button" disabled={item.availability === "Unavailable"} onClick={() => setNotice("Preview only — your bag hasn’t been changed.")} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-stone-900 px-3 text-[10px] font-medium text-stone-900 transition hover:bg-stone-900 hover:text-white disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400">
                  <ShoppingBag className="size-3.5" />{item.availability === "Unavailable" ? "Currently unavailable" : "Add to bag"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="mt-8 flex items-center gap-2 text-[10px] text-stone-400"><ArrowRight className="size-3" />Wishlist changes are local to this design preview.</div>
    </>
  );
}
