import { ArrowRight } from "lucide-react";
import { recentOrderSamples } from "@/components/admin/dashboard/dashboard-data";

export default function RecentOrders() {
  return (
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-serif text-[19px] text-stone-900">Recent Orders</h2>
          <p className="mt-0.5 text-[11px] text-stone-500">A sample of recent store activity</p>
        </div>
        <button type="button" className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-950">
          View all <ArrowRight className="size-3.5" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-xs">
          <thead className="bg-stone-50 text-[10px] font-medium uppercase tracking-[0.1em] text-stone-400">
            <tr>
              <th className="px-5 py-3 sm:px-6">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-5 py-3 sm:px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {recentOrderSamples.map((order) => (
              <tr key={order.id} className="text-stone-600">
                <td className="whitespace-nowrap px-5 py-3.5 font-medium text-stone-800 sm:px-6">{order.id}</td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-full bg-stone-100 text-[9px] font-medium text-stone-600">{order.initials}</span>
                    {order.customer}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-stone-500">{order.date}</td>
                <td className="whitespace-nowrap px-4 py-3.5 font-medium text-stone-800">{order.amount}</td>
                <td className="whitespace-nowrap px-5 py-3.5 sm:px-6">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-600">
                    <span className={`size-1.5 rounded-full ${order.status === "Pending" ? "bg-brand" : "bg-stone-400"}`} />
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-stone-100 px-5 py-3 text-[10px] text-stone-400 sm:px-6">
        Sample order records · not connected to the database
      </div>
    </section>
  );
}
