"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { NavItem } from "@/Data/navItems";

const matchesPath = (pathname: string, href?: string) => Boolean(href && (pathname === href || pathname.startsWith(`${href}/`)));

export default function Navbar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [openItem, setOpenItem] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setOpenItem(null), 0);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return <nav aria-label="Main navigation" className="hidden items-center md:flex" onKeyDown={(event) => {
    if (event.key === "Escape") { setOpenItem(null); (event.target as HTMLElement).blur(); }
  }} onBlurCapture={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenItem(null);
  }}>
    <ul className="flex items-center gap-6">{items.map((item) => <DesktopNavItem
      key={item.label}
      item={item}
      pathname={pathname}
      isOpen={openItem === item.label}
      onOpen={() => item.children?.length && setOpenItem(item.label)}
      onToggle={() => setOpenItem((current) => current === item.label ? null : item.label)}
      onNavigate={() => setOpenItem(null)}
    />)}</ul>
  </nav>;
}

function DesktopNavItem({ item, pathname, isOpen, onOpen, onToggle, onNavigate }: {
  item: NavItem;
  pathname: string;
  isOpen: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const menuId = useId();
  const hasChildren = Boolean(item.children?.length);
  const isActive = matchesPath(pathname, item.href) || Boolean(item.children?.some((child) => matchesPath(pathname, child.href)));

  return <li className="relative" onMouseEnter={onOpen} onMouseLeave={() => isOpen && onNavigate()} onFocusCapture={onOpen}>
    <div className="flex items-center">
      <Link href={item.href ?? "#"} onClick={(event) => { if (hasChildren) { event.preventDefault(); onToggle(); } else onNavigate(); }} className={`relative py-1 text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-200 hover:text-black ${isActive ? "text-black" : "text-neutral-500"}`}>
        {item.label}{isActive && <span className="absolute right-0 bottom-0 left-0 h-[1.5px] bg-black" />}
      </Link>
      {hasChildren && <button type="button" onClick={onToggle} aria-label={`Toggle ${item.label} menu`} aria-haspopup="true" aria-expanded={isOpen} aria-controls={menuId} className="ml-1 cursor-pointer p-1">
        <ChevronDown size={13} strokeWidth={1.7} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>}
    </div>
    {hasChildren && isOpen && <div id={menuId} aria-label={`${item.label} categories`} className="absolute top-full left-1/2 z-50 -translate-x-1/2 pt-4">
      <div className="max-h-[75vh] min-w-[220px] overflow-visible border border-neutral-200 bg-white p-2 shadow-lg">
        {item.children?.map((child) => <DesktopDropdownItem key={child.href ?? child.label} item={child} pathname={pathname} onNavigate={onNavigate} />)}
      </div>
    </div>}
  </li>;
}

function DesktopDropdownItem({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = Boolean(item.children?.length);
  const isActive = matchesPath(pathname, item.href) || Boolean(item.children?.some((child) => matchesPath(pathname, child.href)));

  return <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)} onFocusCapture={() => setIsOpen(true)}>
    <div className={`flex items-center ${isActive ? "bg-neutral-50" : ""}`}>
      <Link href={item.href ?? "#"} onClick={onNavigate} className={`flex min-w-0 flex-1 items-center justify-between gap-4 px-3 py-2.5 text-xs font-medium transition-colors ${isActive ? "text-black" : "text-neutral-600 hover:bg-neutral-50 hover:text-black"}`}>
        <span>{item.label}</span>
      </Link>
      {hasChildren && <button type="button" aria-label={`${isOpen ? "Collapse" : "Expand"} ${item.label} subcategories`} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} className="shrink-0 px-3 py-2.5 text-neutral-500 hover:text-black">
        <ChevronDown size={13} strokeWidth={1.7} className={`-rotate-90 transition-transform ${isOpen ? "rotate-0" : ""}`} />
      </button>}
    </div>
    {hasChildren && isOpen && <div aria-label={`${item.label} subcategories`} className="absolute top-0 left-full min-w-[190px] border border-neutral-200 bg-white p-2 shadow-lg">
      {item.children?.map((child) => <DesktopDropdownItem key={child.href ?? child.label} item={child} pathname={pathname} onNavigate={onNavigate} />)}
    </div>}
  </div>;
}
