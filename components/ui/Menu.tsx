'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/home' },
  { label: 'SHOP', href: '/shop' },
  { label: 'ABOUT', href: '/about' },
  { label: 'CONTACT', href: '/contact' },
];

export default function Navbar({ items = DEFAULT_NAV_ITEMS }: { items?: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-6">
      <ul className="flex items-center gap-6">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`relative py-1 text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-200 hover:text-black ${
                  isActive ? 'text-black' : 'text-neutral-500'
                }`}
              >
                {item.label}

                {/* Subtle Active Line Indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-black" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}