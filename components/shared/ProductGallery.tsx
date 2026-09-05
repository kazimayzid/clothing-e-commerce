"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible flex-shrink-0 w-full md:w-24">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIdx(idx)}
            className={`w-20 h-24 md:w-24 md:h-32 flex-shrink-0 relative overflow-hidden transition-all border ${
              selectedIdx === idx
                ? "border-black ring-1 ring-black"
                : "border-neutral-200 opacity-70 hover:opacity-100"
            }`}
          >
            <Image
              src={img}
              alt={`${title} thumbnail ${idx + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="flex-grow w-full h-[500px] md:h-[700px] bg-neutral-50 relative overflow-hidden border border-neutral-200 group">
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
          <span className="bg-black text-white text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1">
            Limited Batch
          </span>
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded-sm">
            24% OFF
          </span>
        </div>
        <Image
          src={images[selectedIdx] || images[0]}
          alt={title}
          fill
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
    </div>
  );
}