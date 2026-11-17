"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search } from "lucide-react";
import AdminModulePlaceholder from "@/components/admin/AdminModulePlaceholder";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardOverview from "@/components/admin/dashboard/DashboardOverview";
import AdminUsersManagement from "@/components/admin/management/AdminUsersManagement";
import RolesPermissionsManagement from "@/components/admin/management/RolesPermissionsManagement";
import type { AdminInvitationSummary, AdminPermission, AdminRoleSummary, ManagedAdminUser } from "@/components/admin/management/management-types";
import { getAdminPage, type AdminPageKey } from "@/components/admin/admin-navigation";
import { getAdminInitials } from "@/components/admin/admin-utils";

type Props = {
  activeView: AdminPageKey;
  adminName: string;
  currentUserId: string;
  permissionKeys: string[];
  roles?: AdminRoleSummary[];
  permissionCatalog?: AdminPermission[];
  managedUsers?: ManagedAdminUser[];
  invitations?: AdminInvitationSummary[];
  canAssignRoles: boolean;
  canInvite: boolean;
  canDeactivateUsers: boolean;
  canRevokeSessions: boolean;
  canCreateRoles: boolean;
  canUpdateRoles: boolean;
  canDeleteRoles: boolean;
  canAssignPermissions: boolean;
  canViewUsers: boolean;
};

export default function AdminDashboardShell({
  activeView,
  adminName,
  currentUserId,
  permissionKeys,
  roles,
  permissionCatalog,
  managedUsers,
  invitations,
  canAssignRoles,
  canInvite,
  canDeactivateUsers,
  canRevokeSessions,
  canCreateRoles,
  canUpdateRoles,
  canDeleteRoles,
  canAssignPermissions,
  canViewUsers,
}: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const page = getAdminPage(activeView);
  const isDashboard = activeView === "dashboard";

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] border-r border-stone-200 lg:block">
        <AdminSidebar activeView={activeView} adminName={adminName} permissionKeys={permissionKeys} />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close navigation overlay"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(300px,86vw)] border-r border-stone-200 shadow-xl">
            <AdminSidebar
              activeView={activeView}
              adminName={adminName}
              permissionKeys={permissionKeys}
              mobile
              onNavigate={() => setMobileNavOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:ml-[258px]">
        <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-[76px] lg:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="flex size-9 items-center justify-center rounded-md border border-stone-200 text-stone-600 lg:hidden"
            >
              <Menu className="size-[18px]" />
            </button>
            <Link href="/admin/dashboard" className="lg:hidden" aria-label="LuneCraft admin home">
              <span className="block font-serif text-[15px] tracking-[0.12em]">LUNECRAFT</span>
              <span className="block text-[8px] tracking-[0.2em] text-stone-500">STORE ADMIN</span>
            </Link>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <input
                aria-label="Search dashboard"
                placeholder="Search anything..."
                className="h-9 w-56 rounded-md border border-stone-200 bg-stone-50 pl-9 pr-3 text-xs outline-none placeholder:text-stone-400 focus:border-stone-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-stone-500 md:block">
              Welcome back, <span className="font-medium text-stone-700">{adminName.split(" ")[0]}</span>
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-700">
              {getAdminInitials(adminName)}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
          <AdminPageHeader
            title={page.label}
            description={page.description}
            showDashboardActions={isDashboard}
          />
          {isDashboard ? (
            <DashboardOverview />
          ) : activeView === "admin-users" ? (
            <AdminUsersManagement
              initialUsers={managedUsers ?? []}
              initialInvitations={invitations ?? []}
              roles={roles ?? []}
              canAssignRoles={canAssignRoles}
              canInvite={canInvite}
              canDeactivateUsers={canDeactivateUsers}
              canRevokeSessions={canRevokeSessions}
              currentUserId={currentUserId}
            />
          ) : activeView === "roles-permissions" ? (
            <RolesPermissionsManagement
              initialRoles={roles ?? []}
              permissionCatalog={permissionCatalog ?? []}
              initialUsers={managedUsers ?? []}
              canViewUsers={canViewUsers}
              canAssignRoles={canAssignRoles}
              canCreateRoles={canCreateRoles}
              canUpdateRoles={canUpdateRoles}
              canDeleteRoles={canDeleteRoles}
              canAssignPermissions={canAssignPermissions}
              currentUserId={currentUserId}
            />
          ) : (
            <AdminModulePlaceholder pageKey={activeView} />
          )}
          <footer className="mt-8 border-t border-stone-200 pt-4 text-[10px] text-stone-400">
            LuneCraft Admin · Design preview
          </footer>
        </main>
      </div>
    </div>
  );
}
