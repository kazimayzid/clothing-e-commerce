import AccountFrame from "@/components/account/AccountFrame";
import { requireCustomer } from "@/lib/dal";

export default async function CustomerAccountLayout({ children }: { children: React.ReactNode }) {
  await requireCustomer();
  return <AccountFrame>{children}</AccountFrame>;
}
