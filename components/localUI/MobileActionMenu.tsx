"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal, X } from "lucide-react";

export default function MobileActionMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative md:hidden">
      <button
        type="button"
        aria-label={isOpen ? "Close actions" : "Open actions"}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className="flex size-9 items-center justify-center rounded-full border border-black/5 bg-white/80 text-neutral-700 shadow-xs"
      >
        {isOpen ? <X className="size-5" /> : <MoreHorizontal className="size-5" />}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Account and shopping actions"
          className="absolute right-0 top-full z-50 mt-2 flex min-w-52 flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl"
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest('[aria-haspopup="dialog"]')) return;
            if (target.closest("a, button")) setIsOpen(false);
          }}
        >
          {Children.toArray(children).map((child, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50">
              <span className="flex size-8 shrink-0 items-center justify-center">{child}</span>
              <span>{["Search", "Wishlist", "Shopping bag", "Account"][index]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
