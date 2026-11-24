import Link from "next/link";
import { ArrowRight, Heart, PackageOpen } from "lucide-react";

export default function AccountEmptyState({
  kind,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  kind: "wishlist" | "orders";
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  const Icon = kind === "wishlist" ? Heart : PackageOpen;
  return (
    <section className="flex min-h-64 flex-col items-center justify-center border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-[#f5f2ec] text-[#8e6b2f]"><Icon className="size-5" strokeWidth={1.6} /></span>
      <h2 className="mt-5 font-serif text-xl text-stone-900">{title}</h2>
      <p className="mt-2 max-w-sm text-xs leading-5 text-stone-500">{description}</p>
      <Link href={actionHref} className="mt-5 inline-flex min-h-10 items-center gap-2 bg-stone-900 px-4 text-xs font-medium text-white transition hover:bg-stone-700">{actionLabel}<ArrowRight className="size-3.5" /></Link>
    </section>
  );
}
