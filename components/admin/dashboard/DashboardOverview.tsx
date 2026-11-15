import BestSellingProducts from "@/components/admin/dashboard/BestSellingProducts";
import InventorySummary from "@/components/admin/dashboard/InventorySummary";
import OverviewStats from "@/components/admin/dashboard/OverviewStats";
import RecentOrders from "@/components/admin/dashboard/RecentOrders";
import SalesOverview from "@/components/admin/dashboard/SalesOverview";

export default function DashboardOverview() {
  return (
    <>
      <OverviewStats />
      <div className="mb-5">
        <SalesOverview />
      </div>
      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.5fr_1fr]">
        <RecentOrders />
        <div className="space-y-5">
          <BestSellingProducts />
          <InventorySummary />
        </div>
      </div>
    </>
  );
}
