import type { LucideIcon } from "lucide-react";

export default function ManagementStatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-md bg-stone-100 text-stone-600">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-serif text-2xl text-stone-900">{value}</p>
      <p className="mt-1 text-[10px] text-stone-400">{detail}</p>
    </article>
  );
}
