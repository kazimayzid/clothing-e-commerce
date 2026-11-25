"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Search } from "lucide-react";
import AdminModulePlaceholder from "@/components/admin/AdminModulePlaceholder";
import AdminModuleSkeleton from "@/components/admin/AdminModuleSkeleton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardOverview from "@/components/admin/dashboard/DashboardOverview";
import AdminUsersManagement from "@/components/admin/management/AdminUsersManagement";
import RolesPermissionsManagement from "@/components/admin/management/RolesPermissionsManagement";
import AdminAuditLogs from "@/components/admin/management/AdminAuditLogs";
import AdminProductsManagement from "@/components/admin/management/AdminProductsManagement";
import type { AdminAccessRemovalSummary, AdminInvitationSummary, AdminPermission, AdminRoleSummary, ManagedAdminUser } from "@/components/admin/management/management-types";
import { getAdminPage, isAdminPageKey, type AdminPageKey } from "@/components/admin/admin-navigation";
import { getAdminInitials } from "@/components/admin/admin-utils";

type Props = {
  activeView: AdminPageKey;
  adminName: string;
  currentUserId: string;
  permissionKeys: string[];
  isSuperAdmin: boolean;
  roles?: AdminRoleSummary[];
  permissionCatalog?: AdminPermission[];
  managedUsers?: ManagedAdminUser[];
  invitations?: AdminInvitationSummary[];
  accessRemovals?: AdminAccessRemovalSummary[];
  canAssignRoles: boolean;
  canInvite: boolean;
  canDeactivateUsers: boolean;
  canRevokeSessions: boolean;
  actorIsProtectedSuperAdmin: boolean;
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
  isSuperAdmin,
  roles,
  permissionCatalog,
  managedUsers,
  invitations,
  accessRemovals,
  canAssignRoles,
  canInvite,
  canDeactivateUsers,
  canRevokeSessions,
  actorIsProtectedSuperAdmin,
  canCreateRoles,
  canUpdateRoles,
  canDeleteRoles,
  canAssignPermissions,
  canViewUsers,
}: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pendingView, setPendingView] = useState<AdminPageKey | null>(null);
  const [skeletonView, setSkeletonView] = useState<AdminPageKey | null>(null);
  const searchParams = useSearchParams();
  const queryViewParam = searchParams.get("view");
  const urlView = queryViewParam && isAdminPageKey(queryViewParam) ? queryViewParam : "dashboard";
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyNavigation = useRef(false);
  const lastUrlView = useRef<AdminPageKey>(urlView);
  const displayView = pendingView ?? activeView;
  const isNavigating = Boolean(pendingView && pendingView !== activeView);
  const showModuleSkeleton = isNavigating && skeletonView === pendingView;
  const page = getAdminPage(isNavigating && showModuleSkeleton ? displayView : activeView);
  const isDashboard = activeView === "dashboard";

  const clearPendingView = useCallback(() => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = null;
    setPendingView(null);
  }, []);

  const selectAdminView = useCallback((view: AdminPageKey) => {
    if (view === activeView) {
      clearPendingView();
      return;
    }
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    setPendingView(view);
    pendingTimer.current = setTimeout(() => {
      setPendingView((current) => current === view ? null : current);
      pendingTimer.current = null;
    }, 15000);
  }, [activeView, clearPendingView]);

  useEffect(() => {
    const onPopState = () => { historyNavigation.current = true; };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (lastUrlView.current === urlView) return;
    lastUrlView.current = urlView;
    const isHistoryNavigation = historyNavigation.current;
    historyNavigation.current = false;
    const timer = setTimeout(() => {
      if (isHistoryNavigation) {
        if (urlView === activeView) clearPendingView();
        else selectAdminView(urlView);
        return;
      }
      // Sidebar clicks already set the latest intent. Let that navigation win
      // even if an earlier rapid click updates the URL first.
      if (!pendingView && urlView !== activeView) selectAdminView(urlView);
    }, 0);
    return () => clearTimeout(timer);
  }, [urlView, activeView, pendingView, clearPendingView, selectAdminView]);

  useEffect(() => {
    if (!pendingView || pendingView !== activeView) return;
    const timer = setTimeout(clearPendingView, 0);
    return () => clearTimeout(timer);
  }, [pendingView, activeView, clearPendingView]);

  useEffect(() => {
    if (!pendingView || pendingView === activeView) return;
    const timer = setTimeout(() => setSkeletonView(pendingView), 120);
    return () => clearTimeout(timer);
  }, [pendingView, activeView]);

  useEffect(() => () => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] border-r border-stone-200 lg:block">
        <AdminSidebar activeView={activeView} pendingView={pendingView} onSelectView={selectAdminView} adminName={adminName} permissionKeys={permissionKeys} isSuperAdmin={isSuperAdmin} />
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
              pendingView={pendingView}
              onSelectView={selectAdminView}
              adminName={adminName}
              permissionKeys={permissionKeys}
              isSuperAdmin={isSuperAdmin}
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
            <Link href="/admin/landing" className="lg:hidden" aria-label="LuneCraft admin home">
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

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9" aria-busy={isNavigating || undefined}>
          <AdminPageHeader
            title={page.label}
            description={page.description}
            showDashboardActions={page.id === "dashboard"}
          />
          {isNavigating && showModuleSkeleton ? (
            <AdminModuleSkeleton pageKey={displayView} />
          ) : isDashboard ? (
            <DashboardOverview />
          ) : activeView === "admin-users" ? (
            <AdminUsersManagement
              initialUsers={managedUsers ?? []}
              initialInvitations={invitations ?? []}
              initialAccessRemovals={accessRemovals ?? []}
              roles={roles ?? []}
              canAssignRoles={canAssignRoles}
              canInvite={canInvite}
              canDeactivateUsers={canDeactivateUsers}
              canRevokeSessions={canRevokeSessions}
              actorIsProtectedSuperAdmin={actorIsProtectedSuperAdmin}
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
          ) : activeView === "activity-logs" && isSuperAdmin ? (
            <AdminAuditLogs />
          ) : activeView === "products" ? (
            <AdminProductsManagement
              canCreate={isSuperAdmin || permissionKeys.includes("products:create")}
              canUpdate={isSuperAdmin || permissionKeys.includes("products:update")}
              canArchive={isSuperAdmin || permissionKeys.includes("products:archive")}
              canAdjustInventory={isSuperAdmin || permissionKeys.includes("inventory:adjust")}
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
