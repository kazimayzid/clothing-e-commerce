import { getAdminPage, type AdminPageKey } from "@/components/admin/admin-navigation";

export default function AdminModulePlaceholder({ pageKey }: { pageKey: AdminPageKey }) {
  const page = getAdminPage(pageKey);
  const Icon = page.icon;

  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-12 text-center sm:px-10 sm:py-16">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-600">
        <Icon className="size-5" strokeWidth={1.6} />
      </span>
      <h2 className="mt-4 font-serif text-xl text-stone-900">{page.label} workspace</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
        This section is part of the dashboard design and will be connected when the {page.label.toLowerCase()} module is implemented.
      </p>
      <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
        {["Overview", "Records", "Insights"].map((label) => (
          <div key={label} className="rounded-md border border-stone-200 bg-stone-50/60 p-4">
            <p className="text-[11px] font-medium text-stone-700">{label}</p>
            <div className="mt-3 h-2 w-3/4 rounded bg-stone-200" />
            <div className="mt-2 h-2 w-1/2 rounded bg-stone-100" />
          </div>
        ))}
      </div>
      <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
        Design preview · no live data or actions
      </p>
    </div>
  );
}
