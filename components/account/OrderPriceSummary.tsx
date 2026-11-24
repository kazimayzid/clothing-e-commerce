import type { CustomerOrder } from "@/lib/mock-data/customer-account";
import { formatAccountPrice } from "@/lib/mock-data/customer-account";

export default function OrderPriceSummary({ order }: { order: CustomerOrder }) {
  return (
    <section className="border border-stone-200 bg-white p-4 sm:p-5">
      <h2 className="font-serif text-lg text-stone-900">Price summary</h2>
      <dl className="mt-5 space-y-3 text-[11px]">
        <div className="flex justify-between gap-3 text-stone-500"><dt>Subtotal</dt><dd>{formatAccountPrice(order.subtotal)}</dd></div>
        <div className="flex justify-between gap-3 text-stone-500"><dt>Discount</dt><dd>{order.discount ? `−${formatAccountPrice(order.discount)}` : formatAccountPrice(0)}</dd></div>
        <div className="flex justify-between gap-3 text-stone-500"><dt>Shipping</dt><dd>{order.shippingFee ? formatAccountPrice(order.shippingFee) : "Complimentary"}</dd></div>
        <div className="flex justify-between gap-3 text-stone-500"><dt>Tax</dt><dd>{formatAccountPrice(order.tax)}</dd></div>
        <div className="flex justify-between gap-3 border-t border-stone-200 pt-4 text-sm font-medium text-stone-900"><dt>Total paid</dt><dd>{formatAccountPrice(order.total)}</dd></div>
      </dl>
      <p className="mt-4 text-[9px] leading-4 text-stone-400">Historical sample pricing shown for this UI preview.</p>
    </section>
  );
}
