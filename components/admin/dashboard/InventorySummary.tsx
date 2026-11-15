import { inventorySamples } from "@/components/admin/dashboard/dashboard-data";

export default function InventorySummary() {
  return (
    <section className="rounded-lg border border-stone-200 bg-white">
      <div className="border-b border-stone-100 px-5 py-4">
        <h2 className="font-serif text-[19px] text-stone-900">Inventory Summary</h2>
        <p className="mt-0.5 text-[11px] text-stone-500">Stock snapshot</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-stone-100">
        {inventorySamples.map((item) => (
          <div key={item.label} className="px-3 py-5 sm:px-4">
            <p className="font-serif text-2xl text-stone-900">{item.value}</p>
            <p className="mt-1 text-[10px] font-medium text-stone-600">{item.label}</p>
            <p className="mt-1 hidden text-[9px] text-stone-400 sm:block">{item.note}</p>
          </div>
        ))}
      </div>
      <p className="border-t border-stone-100 px-5 py-3 text-[10px] text-stone-400">Illustrative sample data</p>
    </section>
  );
}
