import type { AccountOrderStatus } from "@/lib/mock-data/customer-account";

const styles: Record<AccountOrderStatus, string> = {
  PROCESSING: "border-amber-200 bg-amber-50 text-amber-800",
  SHIPPED: "border-sky-200 bg-sky-50 text-sky-800",
  IN_TRANSIT: "border-indigo-200 bg-indigo-50 text-indigo-800",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-stone-200 bg-stone-100 text-stone-600",
};

const labels: Record<AccountOrderStatus, string> = {
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function OrderStatusBadge({ status }: { status: AccountOrderStatus }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles[status]}`}>{labels[status]}</span>;
}
