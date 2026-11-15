import { weeklySalesSample } from "@/components/admin/dashboard/dashboard-data";

export default function SalesOverview() {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-[20px] text-stone-900">Sales Overview</h2>
          <p className="mt-1 text-xs text-stone-500">A snapshot of your sales this week</p>
        </div>
        <div className="flex w-fit items-center rounded-md border border-stone-200 p-1 text-[11px]">
          {["Weekly", "Monthly", "Yearly"].map((period, index) => (
            <button
              key={period}
              type="button"
              aria-pressed={index === 0}
              className={`rounded px-2.5 py-1.5 ${index === 0 ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-50"}`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex h-[208px]">
        <div className="flex w-10 flex-col justify-between pb-6 text-[10px] text-stone-400" aria-hidden="true">
          <span>$8k</span><span>$6k</span><span>$4k</span><span>$2k</span><span>$0</span>
        </div>
        <div className="relative flex flex-1 items-end justify-around gap-2 border-b border-stone-200 pb-0 pl-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[calc(100%-24px)] flex-col justify-between" aria-hidden="true">
            {[0, 1, 2, 3].map((line) => <span key={line} className="border-t border-dashed border-stone-100" />)}
          </div>
          {weeklySalesSample.map((bar, index) => (
            <div key={bar.day} className="relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div
                className={`w-full max-w-8 rounded-t-sm ${index === 5 ? "bg-brand" : "bg-stone-200"}`}
                style={{ height: `${bar.value}%` }}
                title={`${bar.day}: sample sales`}
              />
              <span className="h-5 text-[10px] text-stone-400">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[10px] text-stone-400">Illustrative sample chart · not connected to store data</p>
    </section>
  );
}
