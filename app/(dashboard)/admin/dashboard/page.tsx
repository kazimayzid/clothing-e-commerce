import { requirePermission } from "@/lib/dal";

export default async function AdminDashboardPage() {
  const session = await requirePermission("dashboard", "access");

  return (
    <main>
      <h1>Admin dashboard</h1>
      <p>Welcome, {session.user.name}</p>
    </main>
  );
}