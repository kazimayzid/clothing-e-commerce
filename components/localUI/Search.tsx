
import React from 'react';
import { Search } from 'lucide-react';

export default function SearchButton() {
  return (
    <button
      aria-label="Search"
      className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs border border-black/5 shadow-xs transition-all duration-200 hover:bg-white hover:scale-110 active:scale-90 focus:outline-none"
    >
      <Search className="h-4 w-4 transition-all duration-200 fill-transparent stroke-neutral-600 group-hover:stroke-black" />
    </button>
  );
}