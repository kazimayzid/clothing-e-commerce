
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { NAV_ITEMS, type NavItem } from "@/Data/navItems";

// ---------------------------------
// Navbar
// ---------------------------------

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center md:flex">
      <ul className="flex items-center gap-6">
        {NAV_ITEMS.map((item) => (
          <DesktopNavItem
            key={item.label}
            item={item}
            pathname={pathname}
          />
        ))}
      </ul>
    </nav>
  );
}

// ---------------------------------
// Desktop Nav Item
// ---------------------------------

interface DesktopNavItemProps {
  item: NavItem;
  pathname: string;
}

function DesktopNavItem({
  item,
  pathname,
}: DesktopNavItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasChildren = Boolean(item.children?.length);

  const isActive =
    pathname === item.href ||
    Boolean(
      item.children?.some(
        (child) =>
          child.href && pathname.startsWith(child.href),
      ),
    );

  return (
    <li
      className="relative"
      onMouseEnter={() => hasChildren && setIsOpen(true)}
      onMouseLeave={() => hasChildren && setIsOpen(false)}
    >
      {/* Main Navigation Item */}

      <div className="flex items-center">
        <Link
          href={item.href ?? "#"}
          className={`relative py-1 text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-200 hover:text-black ${
            isActive ? "text-black" : "text-neutral-500"
          }`}
        >
          {item.label}

          {/* Active Line */}

          {isActive && (
            <span className="absolute right-0 bottom-0 left-0 h-[1.5px] bg-black" />
          )}
        </Link>

        {/* Dropdown Icon */}

        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={`Toggle ${item.label} menu`}
            aria-expanded={isOpen}
            className="ml-1 cursor-pointer p-1"
          >
            <ChevronDown
              size={13}
              strokeWidth={1.7}
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Dropdown */}

      {hasChildren && isOpen && (
        <div className="absolute top-full left-1/2 z-50 -translate-x-1/2 pt-4">
          <div className="min-w-[190px] border border-neutral-200 bg-white p-2 shadow-lg">
            {item.children?.map((child) => (
              <DesktopDropdownItem
                key={child.label}
                item={child}
                pathname={pathname}
              />
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

// ---------------------------------
// Dropdown Item
// ---------------------------------

interface DesktopDropdownItemProps {
  item: NavItem;
  pathname: string;
}

function DesktopDropdownItem({
  item,
  pathname,
}: DesktopDropdownItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasChildren = Boolean(item.children?.length);

  const isActive =
    pathname === item.href ||
    Boolean(
      item.children?.some(
        (child) =>
          child.href && pathname.startsWith(child.href),
      ),
    );

  return (
    <div
      className="relative"
      onMouseEnter={() => hasChildren && setIsOpen(true)}
      onMouseLeave={() => hasChildren && setIsOpen(false)}
    >
      <div className="flex items-center">
        <Link
          href={item.href ?? "#"}
          className={`flex flex-1 items-center justify-between px-3 py-2.5 text-xs font-medium transition-colors ${
            isActive
              ? "text-black"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
          }`}
        >
          <span>{item.label}</span>

          {hasChildren && (
            <ChevronDown
              size={13}
              strokeWidth={1.7}
              className="-rotate-90"
            />
          )}
        </Link>
      </div>

      {/* Nested Dropdown */}

      {hasChildren && isOpen && (
        <div className="absolute top-0 left-full ml-1 min-w-[170px] border border-neutral-200 bg-white p-2 shadow-lg">
          {item.children?.map((child) => (
            <Link
              key={child.label}
              href={child.href ?? "#"}
              className={`block px-3 py-2.5 text-xs font-medium transition-colors ${
                pathname === child.href
                  ? "text-black"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
              }`}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

