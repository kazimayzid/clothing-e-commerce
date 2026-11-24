export default function AccountLoadingSkeleton() {
  return (
    <div aria-label="Loading account page" aria-busy="true" className="animate-pulse space-y-6">
      <div className="border-b border-stone-200 pb-7">
        <div className="h-2 w-28 bg-stone-200" />
        <div className="mt-4 h-9 w-56 max-w-full bg-stone-200" />
        <div className="mt-3 h-3 w-80 max-w-full bg-stone-100" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 border border-stone-100 bg-white p-4"><div className="h-2 w-16 bg-stone-100" /><div className="mt-5 h-6 w-10 bg-stone-200" /></div>)}</div>
      <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-32 border border-stone-100 bg-white" />)}</div>
    </div>
  );
}
