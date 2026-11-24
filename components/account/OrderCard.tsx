import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PackageCheck } from "lucide-react";
import type { CustomerOrder } from "@/lib/mock-data/customer-account";
import { formatAccountDate, formatAccountPrice } from "@/lib/mock-data/customer-account";
import OrderStatusBadge from "@/components/account/OrderStatusBadge";

export default function OrderCard({ order }: { order: CustomerOrder }) {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const detailHref = `/account/orders/${order.id}`;

  return (
    <article className="border border-stone-200 bg-white transition-colors hover:border-stone-300">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-semibold text-stone-900">Order {order.number}</p>
          <p className="mt-1 text-[10px] text-stone-500">Placed {formatAccountDate(order.placedAt)} <span className="mx-1.5 text-stone-300">·</span>{itemCount} {itemCount === 1 ? "item" : "items"}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex shrink-0 -space-x-2">
            {order.items.slice(0, 3).map((item) => (
              <span key={item.id} className="relative size-12 overflow-hidden border-2 border-white bg-stone-100">
                <Image src={item.imageSrc} alt={item.name} fill sizes="48px" className="object-cover" />
              </span>
            ))}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-xs leading-5 text-stone-800">{order.items.map(({ name }) => name).join(", ")}</p>
            <p className="mt-1 text-[10px] text-stone-400">Payment {order.paymentStatus.toLowerCase()}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-5 border-t border-stone-100 pt-3 sm:border-0 sm:pt-0">
          <div className="sm:text-right">
            <p className="text-[9px] uppercase tracking-[0.13em] text-stone-400">Order total</p>
            <p className="mt-1 text-sm font-medium text-stone-900">{formatAccountPrice(order.total)}</p>
          </div>
          <div className="flex items-center gap-2">
            {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
              <Link href={`${detailHref}#tracking`} aria-label={`Track order ${order.number}`} className="inline-flex size-9 items-center justify-center border border-stone-200 text-stone-600 transition hover:border-stone-400 hover:text-stone-950"><PackageCheck className="size-4" /></Link>
            )}
            <Link href={detailHref} className="inline-flex min-h-9 items-center gap-2 border border-stone-300 px-3 text-[10px] font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950">Details<ArrowRight className="size-3" /></Link>
          </div>
        </div>
      </div>
    </article>
  );
}
