import { ArrowRight, ArrowUpRight } from "lucide-react";
import { dashboardMetrics, type DashboardMetric } from "@/components/admin/dashboard/dashboard-data";

function StatCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metric.icon;
  const needsAttention = metric.trend === "attention";

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-stone-500">{metric.label}</p>
        <span className="flex size-8 items-center justify-center rounded-md bg-stone-100 text-stone-600">
          <Icon className="size-4" strokeWidth={1.7} />
        </span>
      </div>
      <p className="mt-4 font-serif text-[26px] tracking-tight text-stone-950">{metric.value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px]">
        <span className={`inline-flex items-center gap-0.5 font-medium ${needsAttention ? "text-stone-600" : "text-brand"}`}>
          {needsAttention ? <ArrowRight className="size-3" /> : <ArrowUpRight className="size-3" />}
          {metric.change}
        </span>
        <span className="text-stone-400">{metric.note}</span>
      </div>
    </article>
  );
}

export default function OverviewStats() {
  return (
    <section aria-label="Store performance metrics" className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
      {dashboardMetrics.map((metric) => <StatCard key={metric.label} metric={metric} />)}
    </section>
  );
}
