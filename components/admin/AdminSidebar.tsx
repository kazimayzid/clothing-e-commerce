"use client";

import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { adminNavigation, type AdminPageKey } from "@/components/admin/admin-navigation";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import { getAdminInitials } from "@/components/admin/admin-utils";

type Props = {
  activeView: AdminPageKey;
  adminName: string;
  permissionKeys: string[];
  onNavigate?: () => void;
  mobile?: boolean;
};

export default function AdminSidebar({
  activeView,
  adminName,
  permissionKeys,
  onNavigate,
  mobile = false,
}: Props) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[76px] items-center justify-between border-b border-stone-200 px-6">
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3"
          aria-label="LuneCraft admin home"
        >
          <span className="flex size-9 items-center justify-center border border-stone-300 font-serif text-lg text-stone-900">
            L
          </span>
          <span>
            <span className="block font-serif text-[18px] tracking-[0.12em] text-stone-900">
              LUNECRAFT
            </span>
            <span className="mt-0.5 block text-[9px] font-medium tracking-[0.22em] text-stone-500">
              STORE ADMIN
            </span>
          </span>
        </Link>
        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
            className="rounded-md p-2 text-stone-500 hover:bg-stone-100"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-5">
        {adminNavigation.map((group) => {
          const visibleItems = group.items.filter((item) =>
            !("requiredPermission" in item) || permissionKeys.includes(item.requiredPermission),
          );
          if (!visibleItems.length) return null;
          return (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-stone-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.id === "dashboard" ? "/admin/dashboard" : `/admin/dashboard?view=${item.id}`}
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
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
        })}
      </nav>

      <div className="border-t border-stone-200 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-md bg-stone-50 p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700">
            {getAdminInitials(adminName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-stone-800">
              {adminName}
            </span>
            <span className="mt-0.5 block text-[11px] text-stone-500">
              Store administrator
            </span>
          </span>
          <ChevronDown className="size-4 text-stone-400" />
        </div>
        <AdminLogoutButton />
      </div>
    </div>
  );
}
