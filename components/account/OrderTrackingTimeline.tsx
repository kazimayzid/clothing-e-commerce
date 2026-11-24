import { Check, Circle, PackageCheck } from "lucide-react";
import type { CustomerOrder } from "@/lib/mock-data/customer-account";
import { formatAccountDateTime } from "@/lib/mock-data/customer-account";

export default function OrderTrackingTimeline({ order }: { order: CustomerOrder }) {
  const events = order.status === "CANCELLED" ? order.tracking.slice(0, 2) : order.tracking;
  const latestCompleted = events.reduce((latest, event, index) => event.date ? index : latest, -1);

  return (
    <section id="tracking" className="scroll-mt-24 border border-stone-200 bg-white p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[9px] tracking-[0.18em] text-[#9b7a3b]">ORDER JOURNEY</p><h2 className="mt-1 font-serif text-xl text-stone-900">Tracking updates</h2></div>
        <PackageCheck className="mt-1 size-5 text-stone-400" strokeWidth={1.6} />
      </div>
      {order.status === "CANCELLED" && <p className="mt-4 border border-stone-200 bg-stone-50 p-3 text-[11px] leading-5 text-stone-600">This sample order was cancelled. Its timeline is illustrative and is not connected to a courier.</p>}
      <ol className="mt-6">
        {events.map((event, index) => {
          const complete = Boolean(event.date);
          const current = index === latestCompleted && order.status !== "DELIVERED" && order.status !== "CANCELLED";
          return (
            <li key={event.title} className="relative flex gap-4 pb-6 last:pb-0">
              {index < events.length - 1 && <span aria-hidden="true" className={`absolute left-[9px] top-5 h-[calc(100%-8px)] w-px ${index < latestCompleted ? "bg-[#a88238]" : "bg-stone-200"}`} />}
              <span className={`relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${current ? "bg-[#a88238] text-white ring-4 ring-[#f5f2ec]" : complete ? "bg-stone-900 text-white" : "border border-stone-300 bg-white text-stone-300"}`}>
                {complete ? <Check className="size-3" strokeWidth={2.4} /> : <Circle className="size-2 fill-current" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                  <p className={`text-xs ${complete ? "font-medium text-stone-900" : "text-stone-400"}`}>{event.title}{current && <span className="ml-2 text-[9px] font-medium uppercase tracking-[0.12em] text-[#9b7a3b]">Current</span>}</p>
                  {event.date && <time dateTime={event.date} className="text-[9px] text-stone-400">{formatAccountDateTime(event.date)}</time>}
                </div>
                <p className={`mt-1 text-[10px] leading-5 ${complete ? "text-stone-500" : "text-stone-400"}`}>{event.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 border-t border-stone-100 pt-4 text-[9px] leading-4 text-stone-400">Illustrative sample tracking only. Courier updates are not live.</p>
    </section>
  );
}
