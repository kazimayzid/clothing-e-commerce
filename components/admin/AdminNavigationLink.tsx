"use client";

import Link, { useLinkStatus } from "next/link";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { AdminPageKey } from "@/components/admin/admin-navigation";

type Props = {
  href: string;
  view: AdminPageKey;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isPending: boolean;
  onSelectView?: (view: AdminPageKey) => void;
  onNavigate?: () => void;
};

export default function AdminNavigationLink({
  href,
  view,
  label,
  icon: Icon,
  isActive,
  isPending,
  onSelectView,
  onNavigate,
}: Props) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) return;
        onSelectView?.(view);
        onNavigate?.();
      }}
      aria-current={isActive ? "page" : undefined}
      aria-busy={isPending || undefined}
      className={`group flex min-h-10 items-center gap-3 rounded-md border-l-2 px-3 text-[13px] transition-colors ${
        isActive || isPending
          ? "border-brand bg-stone-100 font-medium text-stone-950"
          : "border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-950"
      }`}
    >
      <Icon
        className={`size-[17px] shrink-0 ${isActive || isPending ? "text-brand" : "text-stone-500 group-hover:text-stone-800"}`}
        strokeWidth={1.7}
      />
      <span className="min-w-0 flex-1">{label}</span>
      <PendingIndicator label={label} isPending={isPending} />
    </Link>
  );
}

function PendingIndicator({ label, isPending }: { label: string; isPending: boolean }) {
  const { pending: linkPending } = useLinkStatus();
  const pending = isPending || linkPending;
  return (
    <span className="flex size-4 shrink-0 items-center justify-center" aria-live="polite" aria-hidden={!pending}>
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
