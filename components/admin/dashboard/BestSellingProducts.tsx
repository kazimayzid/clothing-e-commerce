import { PackageCheck } from "lucide-react";
import { bestSellerSamples } from "@/components/admin/dashboard/dashboard-data";

export default function BestSellingProducts() {
  return (
    <section className="rounded-lg border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <div>
          <h2 className="font-serif text-[19px] text-stone-900">Best-Selling Products</h2>
          <p className="mt-0.5 text-[11px] text-stone-500">Top performers this month</p>
        </div>
        <button type="button" aria-label="More product options" className="rounded p-1.5 text-stone-400 hover:bg-stone-50">•••</button>
      </div>
      <div className="divide-y divide-stone-100 px-5">
        {bestSellerSamples.map((product, index) => (
          <div key={product.name} className="flex items-center gap-3 py-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-stone-100">
              <PackageCheck className="size-5 text-stone-400" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-stone-800">{product.name}</p>
              <p className="mt-1 text-[10px] text-stone-400">{product.category} · {product.units}</p>
            </div>
            <p className="whitespace-nowrap text-xs font-medium text-stone-700">{product.revenue}</p>
            <span className="sr-only">Rank {index + 1}</span>
          </div>
        ))}
      </div>
      <p className="border-t border-stone-100 px-5 py-3 text-[10px] text-stone-400">Illustrative sample data</p>
    </section>
  );
}
