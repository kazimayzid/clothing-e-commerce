"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import { CartItem } from "@/types/cart";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="flex gap-4 md:gap-6 items-start pt-6 first:pt-0 border-t first:border-t-0 border-neutral-200">
      {/* Thumbnail */}
      <Link
        href={item.slug ? `/products/${item.slug}` : "#"}
        className="relative w-24 md:w-32 aspect-[3/4] bg-neutral-100 overflow-hidden rounded flex-shrink-0"
      >
        <Image
          src={item.imageSrc}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 96px, 128px"
          className="object-cover"
        />
      </Link>

      {/* Item Details */}
      <div className="flex-grow flex flex-col justify-between h-full py-1">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-serif text-lg md:text-xl text-neutral-900 font-medium leading-snug">
              <Link href={item.slug ? `/products/${item.slug}` : "#"}>
                {item.title}
              </Link>
            </h3>
            <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
              {item.variant}
            </p>
          </div>
          <span className="text-sm md:text-base font-semibold text-neutral-900">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>

        {/* Quantity Controls & Remove Action */}
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center border border-neutral-300 rounded overflow-hidden">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, -1)}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-semibold text-neutral-900 select-none">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, 1)}
              aria-label="Increase quantity"
              className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}