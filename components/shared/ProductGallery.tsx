"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images?: string[];
  title: string;
  discount?: string;
}

export default function ProductGallery({
  images = [],
  title,
  discount,
}: ProductGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  // কোনো image না থাকলে
  if (images.length === 0) {
    return (
      <div className="flex h-100 items-center justify-center border border-neutral-200 bg-neutral-100">
        <span className="text-sm text-neutral-500">
          No image available
        </span>
      </div>
    );
  }

  const selectedImage = images[selectedIdx] ?? images[0];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Thumbnails */}
      <div className="order-2 flex w-full gap-3 overflow-x-auto pb-1 lg:order-1 lg:w-24 lg:flex-col lg:overflow-visible">
        {images.map((img, idx) => (
          <button
            key={`${img}-${idx}`}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            aria-label={`View image ${idx + 1}`}
            className={`relative h-20 w-20 shrink-0 overflow-hidden border transition-all duration-300 sm:h-24 sm:w-24 ${
              selectedIdx === idx
                ? "border-black ring-1 ring-black opacity-100"
                : "border-neutral-200 opacity-60 hover:border-neutral-500 hover:opacity-100"
            }`}
          >
            <Image
              src={img}
              alt={`${title} thumbnail ${idx + 1}`}
              fill
              sizes="96px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="group relative order-1 h-100 w-full overflow-hidden border border-neutral-200 bg-neutral-100 sm:h-120 lg:order-2 lg:h-140">
        {/* Badges */}
        <div className="absolute left-4 top-4 z-10 flex flex-col items-start gap-2">
          <span className="bg-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
            Limited Batch
          </span>

          {discount && (
            <span className="border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 z-10 bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            {selectedIdx + 1} / {images.length}
          </div>
        )}

        {/* Main Image */}
        <Image
          key={selectedImage}
          src={selectedImage}
          alt={title}
          fill
          priority={selectedIdx === 0}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
    </div>
  );
}