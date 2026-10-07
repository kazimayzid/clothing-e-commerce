
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Home,
  ShoppingBag,
  Package,
  UserRound,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

import Logo from "../shared/Logo";

/* --------------------------------
   Types
--------------------------------- */

type MenuItem = {
  label: string;
  href?: string;
  icon?: LucideIcon;
  children?: MenuItem[];
};

/* --------------------------------
   Menu Data
--------------------------------- */

const menuItems: MenuItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },

  {
    label: "Shop",
    href: "/shop",
    icon: ShoppingBag,

    children: [
      {
        label: "Men",
        children: [
          {
            label: "Pant",
            href: "/shop?category=pant",
          },
          {
            label: "Shirt",
            href: "/shop?category=shirt",
          },
          {
            label: "T-shirt",
            href: "/shop?category=t-shirt",
          },
        ],
      },

      {
        label: "Women",
        children: [
          {
            label: "Dress",
            href: "/shop?category=dress",
          },
          {
            label: "Tops",
            href: "/shop?category=tops",
          },
        ],
      },

      {
        label: "Accessories",
        children: [
          {
            label: "Bags",
            href: "/shop?category=bags",
          },
          {
            label: "Wallets",
            href: "/shop?category=wallets",
          },
        ],
      },
    ],
  },

  {
    label: "My Orders",
    href: "/orders",
    icon: Package,
  },

  {
    label: "Account",
    href: "/account",
    icon: UserRound,
  },
];

/* --------------------------------
   Props
--------------------------------- */

type NestedMenuProps = {
  items: MenuItem[];
  closeMenu: () => void;
  level?: number;
};

/* --------------------------------
   Reusable Nested Menu
--------------------------------- */

function NestedMenu({
  items,
  closeMenu,
  level = 0,
}: NestedMenuProps) {
  return (
    <div
      className={`border-l border-neutral-200 pl-3 ${
        level === 0 ? "ml-6 mt-1" : "ml-3 mt-1"
      }`}
    >
      <div className="space-y-1">
        {items.map((item) => (
          <NestedMenuItem
            key={item.label}
            item={item}
            closeMenu={closeMenu}
            level={level}
          />
        ))}
      </div>
    </div>
  );
}

/* --------------------------------
   Recursive Menu Item
--------------------------------- */

type NestedMenuItemProps = {
  item: MenuItem;
  closeMenu: () => void;
  level: number;
};

function NestedMenuItem({
  item,
  closeMenu,
  level,
}: NestedMenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasChildren = Boolean(item.children?.length);

  /* --------------------------------
     Leaf item
  --------------------------------- */

  if (!hasChildren) {
    return (
      <Link
        href={item.href ?? "#"}
        onClick={closeMenu}
        className="block rounded-md px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
      >
        {item.label}
      </Link>
    );
  }

  /* --------------------------------
     Parent item
  --------------------------------- */

  return (
    <div>
      <div className="flex items-center rounded-md transition hover:bg-neutral-100">
        {/* Parent Link */}

        {item.href ? (
          <Link
            href={item.href}
            onClick={closeMenu}
            className="flex-1 px-3 py-2.5 text-sm font-medium"
          >
            {item.label}
          </Link>
        ) : (
          <span className="flex-1 px-3 py-2.5 text-sm font-medium">
            {item.label}
          </span>
        )}

        {/* Expand Button */}

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={`Toggle ${item.label}`}
          aria-expanded={isExpanded}
          className="cursor-pointer px-3 py-2.5"
        >
          <ChevronDown
            size={16}
            strokeWidth={1.7}
            className={`transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Nested Children */}

      {isExpanded && item.children && (
        <NestedMenu
          items={item.children}
          closeMenu={closeMenu}
          level={level + 1}
        />
      )}
    </div>
  );
}

/* --------------------------------
   Mobile Menu
--------------------------------- */

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
  };

  /* --------------------------------
     Lock Body Scroll
  --------------------------------- */

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* --------------------------------
          Hamburger
      --------------------------------- */}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        className="inline-flex cursor-pointer items-center justify-center p-2 md:hidden"
      >
        <Menu size={24} />
      </button>

      {/* --------------------------------
          Backdrop
      --------------------------------- */}

      {isOpen && (
        <div
          aria-label="Close navigation menu"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* --------------------------------
          Drawer
      --------------------------------- */}

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
            <Logo />
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

        {/* Menu */}

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              /* --------------------------------
                 Items without children
              --------------------------------- */

              if (!item.children) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href ?? "#"}
                      onClick={closeMenu}
                      className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition hover:bg-neutral-100"
                    >
                      {Icon && (
                        <Icon
                          size={20}
                          strokeWidth={1.7}
                        />
                      )}

                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              }

              /* --------------------------------
                 Shop / Parent Menu
              --------------------------------- */

              return (
                <li key={item.label}>
                  <ParentMenuItem
                    item={item}
                    closeMenu={closeMenu}
                  />
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

/* --------------------------------
   Parent Menu Item
--------------------------------- */

type ParentMenuItemProps = {
  item: MenuItem;
  closeMenu: () => void;
};

function ParentMenuItem({
  item,
  closeMenu,
}: ParentMenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const Icon = item.icon;

  return (
    <>
      <div className="flex items-center rounded-lg transition hover:bg-neutral-100">
        {/* Main Link */}

        <Link
          href={item.href ?? "#"}
          onClick={closeMenu}
          className="flex flex-1 items-center gap-4 px-4 py-3 text-sm font-medium"
        >
          {Icon && (
            <Icon
              size={20}
              strokeWidth={1.7}
            />
          )}

          <span>{item.label}</span>
        </Link>

        {/* Dropdown Button */}

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={`Toggle ${item.label} categories`}
          aria-expanded={isExpanded}
          className="cursor-pointer px-4 py-3"
        >
          <ChevronDown
            size={18}
            strokeWidth={1.7}
            className={`transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Children */}

      {isExpanded && item.children && (
        <NestedMenu
          items={item.children}
          closeMenu={closeMenu}
        />
      )}
    </>
  );
}

