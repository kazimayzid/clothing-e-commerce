import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, PackageCheck } from "lucide-react";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import OrderPriceSummary from "@/components/account/OrderPriceSummary";
import OrderPreviewActions from "@/components/account/OrderPreviewActions";
import OrderStatusBadge from "@/components/account/OrderStatusBadge";
import OrderTrackingTimeline from "@/components/account/OrderTrackingTimeline";
import { formatAccountDate, formatAccountPrice, mockCustomerOrders } from "@/lib/mock-data/customer-account";

export default async function OrderDetailsPage({ params }: PageProps<"/account/orders/[orderId]">) {
  const { orderId } = await params;
  const order = mockCustomerOrders.find((entry) => entry.id === orderId);
  if (!order) notFound();
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const canTrack = order.status !== "DELIVERED" && order.status !== "CANCELLED";

  return (
    <>
      <AccountPageHeader
        eyebrow={`ORDER PLACED ${formatAccountDate(order.placedAt).toUpperCase()}`}
        title={order.number}
        description={`${itemCount} ${itemCount === 1 ? "item" : "items"} · ${order.paymentStatus} · Sample order details`}
        aside={<div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={order.status} /><span className="border border-stone-200 bg-white px-2.5 py-1 text-[10px] text-stone-600">{order.paymentStatus}</span></div>}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(250px,0.7fr)]">
        <div className="min-w-0 space-y-6">
          <section className="border border-stone-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-5">
              <div><p className="text-[9px] tracking-[0.16em] text-[#9b7a3b]">IN THIS ORDER</p><h2 className="mt-1 font-serif text-lg text-stone-900">Order items</h2></div>
              <span className="text-[10px] text-stone-400">{itemCount} total</span>
            </div>
            <div className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.id}`} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                  <Link href={`/products/${item.slug}`} className="relative size-[76px] shrink-0 overflow-hidden bg-stone-100 sm:size-[90px]"><Image src={item.imageSrc} alt={item.name} fill sizes="90px" className="object-cover object-top" /></Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0"><Link href={`/products/${item.slug}`} className="text-xs font-medium leading-5 text-stone-900 hover:underline">{item.name}</Link><p className="mt-1 text-[10px] text-stone-500">{item.variant}</p><p className="mt-1 text-[9px] text-stone-400">SKU {item.sku}</p></div>
                    <div className="flex items-center justify-between gap-4 text-[10px] sm:flex-col sm:items-end sm:gap-2"><span className="text-stone-500">Qty {item.quantity}</span><span className="font-medium text-stone-900">{formatAccountPrice(item.unitPrice * item.quantity)}</span><span className="text-stone-400">{formatAccountPrice(item.unitPrice)} each</span></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <OrderTrackingTimeline order={order} />

          <section className="border border-stone-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2"><MapPin className="size-4 text-[#a88238]" /><h2 className="font-serif text-lg text-stone-900">Shipping information</h2></div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div><p className="text-[9px] uppercase tracking-[0.13em] text-stone-400">Delivering to</p><p className="mt-2 text-xs font-medium text-stone-800">{order.shipping.name}</p><p className="mt-1 text-[10px] leading-5 text-stone-500">{order.shipping.line1}<br />{order.shipping.line2}<br />{order.shipping.city}, {order.shipping.postcode}<br />{order.shipping.phone}</p></div>
              <div><p className="text-[9px] uppercase tracking-[0.13em] text-stone-400">Courier details</p><p className="mt-2 text-xs font-medium text-stone-800">{order.courier}</p><p className="mt-1 text-[10px] text-stone-500">Tracking number</p><p className="mt-1 break-all font-mono text-[10px] text-stone-700">{order.trackingNumber}</p><p className="mt-2 inline-flex items-center gap-1.5 text-[9px] text-stone-400"><PackageCheck className="size-3" />Illustrative sample information</p></div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <OrderPriceSummary order={order} />
          <OrderPreviewActions orderId={order.number} canTrack={canTrack} />
          {order.deliveredAt && <p className="border border-stone-200 bg-white p-4 text-[10px] leading-5 text-stone-500">Delivered on <span className="font-medium text-stone-700">{formatAccountDate(order.deliveredAt)}</span>. Historical prices and delivery details are sample data.</p>}
        </aside>
      </div>
    </>
  );
}
