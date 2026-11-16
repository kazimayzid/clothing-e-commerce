export default function AdminStatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${active ? "bg-stone-100 text-stone-700" : "bg-stone-200 text-stone-500"}`}>
      <span className={`size-1.5 rounded-full ${active ? "bg-stone-600" : "bg-stone-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
