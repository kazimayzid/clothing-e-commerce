import type { AdminPageKey } from "@/components/admin/admin-navigation";

function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-stone-200/80 ${className}`} />;
}

function StatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
          <Block className="h-3 w-24" />
          <Block className="mt-4 h-7 w-16" />
          <Block className="mt-3 h-2.5 w-32 max-w-full" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="grid gap-4 border-b border-stone-100 px-5 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }, (_, index) => <Block key={index} className="h-2.5 w-16 max-w-full" />)}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="grid items-center gap-4 border-b border-stone-100 px-5 py-4 last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, column) => <Block key={column} className={`${column === 0 ? "h-4 w-32" : "h-3 w-20"} max-w-full`} />)}
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <StatCards />
      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="flex items-center justify-between"><Block className="h-4 w-36" /><Block className="h-8 w-28" /></div>
        <Block className="mt-6 h-56 w-full" />
      </section>
      <div className="grid gap-5 2xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-lg border border-stone-200 bg-white p-5"><Block className="mb-5 h-4 w-32" /><TableSkeleton rows={4} columns={4} /></section>
        <div className="space-y-5"><section className="rounded-lg border border-stone-200 bg-white p-5"><Block className="h-4 w-36" /><Block className="mt-5 h-32 w-full" /></section><section className="rounded-lg border border-stone-200 bg-white p-5"><Block className="h-4 w-32" /><Block className="mt-5 h-28 w-full" /></section></div>
      </div>
    </div>
  );
}

function AdminUsersSkeleton() {
  return <div className="space-y-5"><StatCards /><section className="overflow-hidden rounded-lg border border-stone-200 bg-white"><div className="space-y-4 border-b border-stone-200 p-4 sm:p-5"><div className="flex items-center justify-between"><div><Block className="h-5 w-36" /><Block className="mt-2 h-3 w-56" /></div><Block className="h-9 w-32" /></div><div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_190px_160px]"><Block className="h-9" /><Block className="h-9" /><Block className="h-9" /></div></div><TableSkeleton rows={7} columns={5} /></section></div>;
}

function RolesSkeleton() {
  return <div className="space-y-5"><StatCards count={3} /><section className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5"><div className="flex items-center justify-between"><Block className="h-5 w-44" /><Block className="h-9 w-28" /></div><Block className="mt-4 h-9 w-full max-w-sm" /><div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="rounded-lg border border-stone-200 p-4"><Block className="h-4 w-32" /><Block className="mt-3 h-3 w-full" /><Block className="mt-2 h-3 w-2/3" /><Block className="mt-5 h-8 w-24" /></div>)}</div></section></div>;
}

function ActivityLogsSkeleton() {
  return <section className="overflow-hidden rounded-xl border border-stone-200 bg-white"><div className="grid gap-3 border-b border-stone-100 p-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Block key={index} className="h-10" />)}</div><TableSkeleton rows={8} columns={6} /><div className="flex justify-between p-4"><Block className="h-3 w-32" /><Block className="h-8 w-24" /></div></section>;
}

function CategoriesSkeleton() {
  return <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-5"><div className="flex items-center justify-between"><Block className="h-5 w-44" /><Block className="h-9 w-28" /></div><div className="grid gap-2 sm:grid-cols-2"><Block className="h-9" /><Block className="h-9" /></div><div className="space-y-2">{Array.from({ length: 7 }, (_, index) => <Block key={index} className={`h-12 ${index % 3 === 2 ? "ml-8" : ""}`} />)}</div></section>;
}

function PlaceholderSkeleton() {
  return <section className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-12 sm:px-10 sm:py-16"><Block className="mx-auto size-12 rounded-full" /><Block className="mx-auto mt-4 h-6 w-48" /><Block className="mx-auto mt-3 h-3 w-full max-w-md" /><Block className="mx-auto mt-2 h-3 w-64 max-w-full" /><div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="rounded-md border border-stone-200 bg-stone-50/60 p-4"><Block className="h-3 w-20" /><Block className="mt-4 h-2 w-3/4" /><Block className="mt-2 h-2 w-1/2" /></div>)}</div></section>;
}

export default function AdminModuleSkeleton({ pageKey }: { pageKey: AdminPageKey }) {
  const label = pageKey.replaceAll("-", " ");
  return (
    <div role="status" aria-label={`Loading ${label}`} aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading {label}</span>
      {pageKey === "dashboard" ? <DashboardSkeleton />
        : pageKey === "admin-users" ? <AdminUsersSkeleton />
          : pageKey === "roles-permissions" ? <RolesSkeleton />
              : pageKey === "activity-logs" ? <ActivityLogsSkeleton />
                : pageKey === "categories" ? <CategoriesSkeleton />
              : <PlaceholderSkeleton />}
    </div>
  );
}
