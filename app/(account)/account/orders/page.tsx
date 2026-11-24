import AccountPageHeader from "@/components/account/AccountPageHeader";
import OrdersClient from "@/components/account/OrdersClient";
import { mockCustomerOrders } from "@/lib/mock-data/customer-account";

export default function OrdersPage() {
  return (
    <>
      <AccountPageHeader title="My Orders" description="Follow your current deliveries and revisit pieces from seasons past." aside={<span className="text-xs text-stone-500">{mockCustomerOrders.length} sample orders</span>} />
      <OrdersClient orders={mockCustomerOrders} />
    </>
  );
}
