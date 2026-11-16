"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
};

const widthClasses = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
} as const;

export default function AdminDialog({
  title,
  description,
  onClose,
  children,
  size = "md",
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        className={`max-h-[92dvh] w-full ${widthClasses[size]} overflow-y-auto rounded-t-2xl border border-stone-200 bg-white shadow-2xl sm:rounded-xl`}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 id="admin-dialog-title" className="font-serif text-xl text-stone-900">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>}
          </div>
          <button autoFocus type="button" onClick={onClose} aria-label="Close dialog" className="shrink-0 rounded-md p-2 text-stone-500 hover:bg-stone-100">
            <X className="size-4" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
