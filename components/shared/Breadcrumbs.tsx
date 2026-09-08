import React from 'react'

export default function Breadcrumbs() {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <nav className="text-xs text-neutral-500 font-medium">
          Women / Bags /{" "}
          <span className="text-black font-semibold">Totes</span>
        </nav>

        <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Top Seller
        </span>
      </div>
    </div>
  )
}


