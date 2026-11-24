"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MapPin, PackageCheck, Settings2, UserRound } from "lucide-react";

const links = [
  { href: "/account", label: "Overview", icon: UserRound },
  { href: "/account/orders", label: "My Orders", icon: PackageCheck },
  { href: "/account/wishlist", label: "My Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile Settings", icon: Settings2 },
];

function isActive(pathname: string, href: string) {
  if (href === "/account") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AccountNavigation() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden lg:block">
        <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-stone-400">YOUR ACCOUNT</p>
        <nav aria-label="Customer account" className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 border-l-2 px-3 text-[13px] transition-colors ${active ? "border-[#a88238] bg-[#f5f2ec] font-medium text-stone-950" : "border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-950"}`}>
                <Icon className={`size-4 ${active ? "text-[#8e6b2f]" : "text-stone-400"}`} strokeWidth={1.7} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-stone-200 px-3 pt-5">
          <p className="text-[10px] leading-5 text-stone-400">Need a hand with an order?</p>
          <Link href="/contact" className="mt-1 inline-block text-xs text-stone-700 underline decoration-stone-300 underline-offset-4 hover:text-stone-950">Contact our team</Link>
        </div>
      </aside>

      <nav aria-label="Customer account" className="-mx-4 mb-6 overflow-x-auto border-b border-stone-200 px-4 lg:hidden">
        <div className="flex w-max min-w-full gap-5 sm:gap-7">
          {links.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 shrink-0 items-center border-b-2 text-xs transition-colors ${active ? "border-[#a88238] font-medium text-stone-950" : "border-transparent text-stone-500 hover:text-stone-900"}`}>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
