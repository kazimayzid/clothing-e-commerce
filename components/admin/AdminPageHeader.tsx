import { Bell, CalendarDays, ChevronDown } from "lucide-react";

type Props = {
  title: string;
  description: string;
  showDashboardActions?: boolean;
};

export default function AdminPageHeader({
  title,
  description,
  showDashboardActions = false,
}: Props) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 text-xs text-stone-500">
          Admin / <span className="text-stone-700">{title}</span>
        </p>
        <h1 className="font-serif text-[30px] leading-tight tracking-tight text-stone-950 sm:text-[34px]">
          {title}
        </h1>
        <p className="mt-1.5 text-[13px] text-stone-500">{description}</p>
      </div>
      {showDashboardActions && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-3.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
          >
            <CalendarDays className="size-4 text-stone-500" />
            <span>Last 7 days</span>
            <ChevronDown className="size-3.5 text-stone-400" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50"
          >
            <Bell className="size-[17px]" strokeWidth={1.7} />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand" />
          </button>
        </div>
      )}
    </div>
  );
}
