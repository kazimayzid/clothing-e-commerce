import { requirePermission } from "@/lib/dal";
import AdminDashboardShell from "@/components/admin/AdminDashboardShell";
import { isAdminPageKey } from "@/components/admin/admin-navigation";

export default async function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin/dashboard">) {
  const session = await requirePermission("dashboard", "access");
  const params = await searchParams;
  const requestedView = Array.isArray(params.view) ? params.view[0] : params.view;
  const activeView = isAdminPageKey(requestedView) ? requestedView : "dashboard";

  return <AdminDashboardShell activeView={activeView} adminName={session.user.name} />;
}
