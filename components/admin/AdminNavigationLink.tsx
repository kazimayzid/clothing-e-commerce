"use client";

import Link, { useLinkStatus } from "next/link";
import { LoaderCircle, type LucideIcon } from "lucide-react";

type Props = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onNavigate?: () => void;
};

export default function AdminNavigationLink({ href, label, icon: Icon, isActive, onNavigate }: Props) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`group flex min-h-10 items-center gap-3 rounded-md border-l-2 px-3 text-[13px] transition-colors ${
        isActive
          ? "border-brand bg-stone-100 font-medium text-stone-950"
          : "border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-950"
      }`}
    >
      <Icon
        className={`size-[17px] shrink-0 ${isActive ? "text-brand" : "text-stone-500 group-hover:text-stone-800"}`}
        strokeWidth={1.7}
      />
      <span className="min-w-0 flex-1">{label}</span>
      <PendingIndicator label={label} />
    </Link>
  );
}

function PendingIndicator({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className="flex size-4 shrink-0 items-center justify-center" aria-live="polite">
      {pending && (
        <LoaderCircle
          className="size-3.5 animate-spin text-stone-400"
          aria-label={`Loading ${label}`}
          role="status"
        />
      )}
    </span>
  );
}
