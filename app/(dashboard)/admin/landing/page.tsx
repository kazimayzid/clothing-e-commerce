import { redirect } from "next/navigation";
import { adminNavigation } from "@/components/admin/admin-navigation";
import { canAccessAdminModule } from "@/lib/admin-module-policy";
import { requireAdmin } from "@/lib/dal";

export default async function AdminLandingPage() {
  const { access } = await requireAdmin();
  if (access.isSuperAdmin) redirect("/admin/dashboard");

  let firstAllowedModuleId: string | undefined;
  for (const group of adminNavigation) {
    const firstAllowed = group.items.find((item) => canAccessAdminModule(false, access.permissions, item));
    if (firstAllowed) {
      firstAllowedModuleId = firstAllowed.id;
      break;
    }
  }

  if (!firstAllowedModuleId) redirect("/admin/forbidden");
  redirect(`/admin/dashboard?view=${firstAllowedModuleId}`);
}
