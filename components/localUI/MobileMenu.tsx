"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Home,
  ShoppingBag,
  LayoutGrid,
  Package,
  UserRound,
} from "lucide-react";
import Logo from "../shared/Logo";

const menuItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shop", href: "/products", icon: ShoppingBag },
  { label: "Categories", href: "/categories", icon: LayoutGrid },
  { label: "My Orders", href: "/orders", icon: Package },
  { label: "Account", href: "/account", icon: UserRound },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        className="inline-flex cursor-pointer items-center justify-center p-2 md:hidden"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          aria-label="Close navigation menu"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Navigation Drawer */}
      <aside
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 z-[999] flex h-[100dvh] w-[85%] max-w-sm flex-col bg-white text-black shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-5">
          <Link
            href="/"
            onClick={closeMenu}
            className="text-xl font-bold tracking-tight"
          >
            <Logo/>
          </Link>

          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close navigation menu"
            className="cursor-pointer rounded-full p-2 transition hover:bg-neutral-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition hover:bg-neutral-100"
                  >
                    <Icon size={20} strokeWidth={1.7} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-5 py-5">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Velvetgear. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}