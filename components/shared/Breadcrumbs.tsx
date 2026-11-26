import Link from "next/link";

type BreadcrumbItem = { id: string; name: string; slug: string };

export default function Breadcrumbs({ items = [], currentLabel }: { items?: BreadcrumbItem[]; currentLabel?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 min-w-0 overflow-x-auto text-xs font-medium text-neutral-500">
      <ol className="flex w-max min-w-full items-center gap-2 whitespace-nowrap">
        <li><Link href="/" className="hover:text-black">Home</Link></li>
        {items.map((item, index) => <li key={item.id} className="flex items-center gap-2">
          <span aria-hidden="true">/</span>
          {index === items.length - 1 && !currentLabel
            ? <span aria-current="page" className="font-semibold text-black">{item.name}</span>
            : <Link href={`/categories/${items.slice(0, index + 1).map(({ slug }) => encodeURIComponent(slug)).join("/")}`} className="hover:text-black">{item.name}</Link>}
        </li>)}
        {currentLabel && <li className="flex items-center gap-2"><span aria-hidden="true">/</span><span aria-current="page" className="font-semibold text-black">{currentLabel}</span></li>}
      </ol>
    </nav>
  );
}
