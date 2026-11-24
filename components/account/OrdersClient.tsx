"use client";

import { useMemo, useState } from "react";
import OrderCard from "@/components/account/OrderCard";
import AccountEmptyState from "@/components/account/AccountEmptyState";
import type { CustomerOrder } from "@/lib/mock-data/customer-account";

const filters = [
  { id: "ALL", label: "All orders" },
  { id: "PROCESSING", label: "Processing" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
] as const;

export default function OrdersClient({ orders }: { orders: CustomerOrder[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("ALL");
  const visibleOrders = useMemo(() => orders.filter((order) => {
    if (filter === "ALL") return true;
    if (filter === "SHIPPED") return order.status === "SHIPPED" || order.status === "IN_TRANSIT";
    return order.status === filter;
  }), [orders, filter]);

  return (
    <div>
      <div className="mb-5 overflow-x-auto border-b border-stone-200">
        <div role="tablist" aria-label="Filter orders" className="flex w-max min-w-full gap-5 sm:gap-7">
          {filters.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)} className={`min-h-11 shrink-0 border-b-2 text-[11px] transition-colors ${filter === item.id ? "border-[#a88238] font-medium text-stone-950" : "border-transparent text-stone-500 hover:text-stone-900"}`}>
              {item.label}<span className="ml-2 text-[9px] text-stone-400">{item.id === "ALL" ? orders.length : orders.filter((order) => item.id === "SHIPPED" ? order.status === "SHIPPED" || order.status === "IN_TRANSIT" : order.status === item.id).length}</span>
            </button>
          ))}
        </div>
      </div>
      {visibleOrders.length ? (
        <div className="space-y-3">{visibleOrders.map((order) => <OrderCard key={order.id} order={order} />)}</div>
      ) : (
        <AccountEmptyState kind="orders" title="No orders in this view" description="Try another status filter, or visit the store to find a piece you’ll love." actionLabel="Continue shopping" actionHref="/shop" />
      )}
      <p className="mt-5 text-[10px] leading-5 text-stone-400">Order information shown here is illustrative sample data for the account preview.</p>
    </div>
  );
}
