'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, Clock, ChevronUp } from 'lucide-react';

export interface Product {
  id: string;
  title: string;
  colorName: string;
  price: string;
  multibuyPrice?: string;
  imageSrc: string;
  isNew?: boolean;
  bestsellerRank?: number;
  categoryName?: string;
  sellingFastCount?: number;
  colorCount?: number;
  href?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const {
    id,
    title,
    colorName,
    price,
    multibuyPrice,
    imageSrc,
    isNew = false,
    bestsellerRank,
    categoryName = 'Polos',
    sellingFastCount = 0,
    colorCount = 0,
    href = `/product/${id}`,
  } = product;

  return (
    <div className="group relative flex w-full flex-col overflow-hidden bg-white">
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#e8e6e3]">
        <Link href={href} className="block h-full w-full cursor-pointer">
          <Image
            src={imageSrc}
            alt={`${title} - ${colorName}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            priority
          />
        </Link>

        {/* Top Left Badge: NEW */}
        {isNew && (
          <div className="absolute top-0 left-0 bg-[#001d4a] px-3 py-1 text-[11px] font-bold tracking-widest text-white uppercase">
            NEW
          </div>
        )}

        {/* Bottom Left Overlay: Selling Fast Banner */}
        {sellingFastCount > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-xs bg-[#ff5252] px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs">
            <Clock className="h-3.5 w-3.5 stroke-[2.2]" />
            <span>Selling Fast! Sold {sellingFastCount} times in the last 48hrs</span>
          </div>
        )}

        {/* Bottom Right Overlay: Color Options Pill */}
        {colorCount > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-xs bg-white/90 px-2 py-0.5 text-[11px] font-medium text-neutral-800 shadow-xs backdrop-blur-xs cursor-pointer hover:bg-white">
            <span>{colorCount} Colours</span>
            <ChevronUp className="h-3 w-3 text-neutral-600" />
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="flex flex-col pt-3 pb-1 text-left">
        {/* Bestseller Badge Line */}
        {bestsellerRank && bestsellerRank > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#a88238]">
            <Award className="h-4 w-4 fill-[#a88238]/15 stroke-[1.75]" />
            <span>
              Top {bestsellerRank} Bestseller{' '}
              <span className="font-normal text-neutral-500">in {categoryName}</span>
            </span>
          </div>
        )}

        {/* Product Title */}
        <h3 className="mt-1.5 text-sm font-medium text-neutral-900 group-hover:underline">
          <Link href={href} className="cursor-pointer">
            {title} - {colorName}
          </Link>
        </h3>

        {/* Pricing */}
        <div className="mt-1 flex flex-col">
          <span className="text-sm font-bold text-neutral-900">{price}</span>
          {multibuyPrice && (
            <span className="text-xs text-neutral-500 font-normal">
              {multibuyPrice} Multibuy
            </span>
          )}
        </div>
      </div>
    </div>
  );
}