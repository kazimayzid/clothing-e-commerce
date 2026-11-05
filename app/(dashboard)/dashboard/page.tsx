import { requireUser } from "@/lib/dal";

export default async function DashboardPage() {
  const session = await requireUser();

  return <div>Welcome, {session.user.name}</div>;
}