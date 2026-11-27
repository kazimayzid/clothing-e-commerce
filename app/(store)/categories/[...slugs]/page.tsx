import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import ProductCard from "@/components/product/ProductCard";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { getAllCategoryRecords } from "@/lib/product-category-service";
import { matchCategorySlugPath } from "@/lib/category-tree";
import { getPublicProductListing, type PublicProductSort } from "@/lib/public-product-listing";

type Props = { params: Promise<{ slugs: string[] }>; searchParams: Promise<{ q?: string; search?: string; page?: string; sort?: string; gender?: string; minPrice?: string; maxPrice?: string }> };

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slugs }, filters] = await Promise.all([params, searchParams]);
  const categories = await getAllCategoryRecords();
  const match = matchCategorySlugPath(slugs, categories);
  if (!match) notFound();
  const query = (filters.search ?? filters.q)?.trim().slice(0, 100);
  const page = Math.max(1, Math.min(100_000, Number.parseInt(filters.page ?? "1", 10) || 1));
  const sort: PublicProductSort = ["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc"].includes(filters.sort ?? "")
    ? filters.sort as PublicProductSort
    : "newest";
  const gender = ["MEN", "WOMEN", "UNISEX", "KIDS"].includes(filters.gender?.toUpperCase() ?? "") ? filters.gender!.toUpperCase() as "MEN" | "WOMEN" | "UNISEX" | "KIDS" : undefined;
  const minPrice = filters.minPrice && /^\d{1,8}(?:\.\d{1,2})?$/.test(filters.minPrice) ? filters.minPrice : undefined;
  const maxPrice = filters.maxPrice && /^\d{1,8}(?:\.\d{1,2})?$/.test(filters.maxPrice) ? filters.maxPrice : undefined;
  const result = await getPublicProductListing({ categoryId: match.category.id, includeDescendants: true, search: query, gender, minPrice, maxPrice, page, pageSize: 24, sort });
  const directChildren = categories.filter(({ parentId, archivedAt }) => parentId === match.category.id && !archivedAt);
  const href = `/categories/${slugs.map(encodeURIComponent).join("/")}`;
  return <Container><div className="py-8">
    <Breadcrumbs items={match.path} />
    <h1 className="font-serif text-3xl text-stone-900">{match.category.name}</h1>
    {match.category.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{match.category.description}</p>}
    {directChildren.length > 0 && <nav aria-label="Subcategories" className="mt-5 flex flex-wrap gap-2">{directChildren.map((child) => <Link key={child.id} href={`${href}/${encodeURIComponent(child.slug)}`} className="rounded-full border border-stone-200 px-3 py-1.5 text-xs text-stone-700 hover:border-stone-500">{child.name}</Link>)}</nav>}
    <form action={href} className="mt-6 grid max-w-5xl gap-2 sm:grid-cols-2 lg:grid-cols-6"><input name="search" defaultValue={query} placeholder={`Search ${match.category.name}`} className="h-10 min-w-0 rounded border border-stone-200 px-3 text-sm lg:col-span-2" /><select name="gender" defaultValue={gender ?? ""} className="h-10 rounded border border-stone-200 px-3 text-xs"><option value="">All departments</option><option value="MEN">Men</option><option value="WOMEN">Women</option><option value="KIDS">Kids</option><option value="UNISEX">Unisex</option></select><input name="minPrice" type="number" min="0" step="0.01" defaultValue={minPrice} placeholder="Min price" className="h-10 min-w-0 rounded border border-stone-200 px-3 text-xs" /><input name="maxPrice" type="number" min="0" step="0.01" defaultValue={maxPrice} placeholder="Max price" className="h-10 min-w-0 rounded border border-stone-200 px-3 text-xs" /><select name="sort" defaultValue={sort} className="h-10 rounded border border-stone-200 px-3 text-xs"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name_asc">Name: A–Z</option><option value="name_desc">Name: Z–A</option></select><button className="h-10 rounded bg-stone-900 px-4 text-xs text-white lg:col-span-6">Apply filters</button></form>
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{result.products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
    {!result.products.length && <p className="py-16 text-center text-sm text-stone-500">No products found in this category.</p>}
    {result.pagination.totalPages > 1 && <nav aria-label="Product pages" className="mt-8 flex items-center justify-center gap-4 text-xs"><Link aria-disabled={page <= 1} className={`rounded border px-3 py-2 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-stone-500"}`} href={`${href}?${new URLSearchParams({ ...(query ? { search: query } : {}), sort, ...(gender ? { gender } : {}), ...(minPrice ? { minPrice } : {}), ...(maxPrice ? { maxPrice } : {}), page: String(Math.max(1, page - 1)) })}`}>Previous</Link><span>Page {page} of {result.pagination.totalPages}</span><Link aria-disabled={page >= result.pagination.totalPages} className={`rounded border px-3 py-2 ${page >= result.pagination.totalPages ? "pointer-events-none opacity-40" : "hover:border-stone-500"}`} href={`${href}?${new URLSearchParams({ ...(query ? { search: query } : {}), sort, ...(gender ? { gender } : {}), ...(minPrice ? { minPrice } : {}), ...(maxPrice ? { maxPrice } : {}), page: String(Math.min(result.pagination.totalPages, page + 1)) })}`}>Next</Link></nav>}
  </div></Container>;
}
