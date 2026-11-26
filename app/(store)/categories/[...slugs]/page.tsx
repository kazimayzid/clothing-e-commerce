import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import ProductCard from "@/components/product/ProductCard";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { prisma } from "@/lib/prisma";
import { adminProductInclude, toProductCardDTO } from "@/lib/product-data";
import { getAllCategoryRecords, matchCategorySlugPath } from "@/lib/product-category-service";
import { getDescendantCategoryIds, isActiveCategoryPath } from "@/lib/category-tree";

type Props = { params: Promise<{ slugs: string[] }>; searchParams: Promise<{ q?: string }> };

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slugs }, filters] = await Promise.all([params, searchParams]);
  const categories = await getAllCategoryRecords();
  const match = matchCategorySlugPath(slugs, categories);
  if (!match) notFound();
  const categoryIds = getDescendantCategoryIds(match.category.id, categories).filter((id) => isActiveCategoryPath(id, categories));
  const query = filters.q?.trim().slice(0, 100);
  const products = await prisma.product.findMany({ where: {
    status: "PUBLISHED",
    categoryId: { in: categoryIds },
    ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { tags: { has: query.toLowerCase() } }] } : {}),
  }, include: adminProductInclude, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 100 });
  const directChildren = categories.filter(({ parentId, archivedAt }) => parentId === match.category.id && !archivedAt);
  const href = `/categories/${slugs.map(encodeURIComponent).join("/")}`;
  return <Container><div className="py-8">
    <Breadcrumbs items={match.path} />
    <h1 className="font-serif text-3xl text-stone-900">{match.category.name}</h1>
    {match.category.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{match.category.description}</p>}
    {directChildren.length > 0 && <nav aria-label="Subcategories" className="mt-5 flex flex-wrap gap-2">{directChildren.map((child) => <Link key={child.id} href={`${href}/${encodeURIComponent(child.slug)}`} className="rounded-full border border-stone-200 px-3 py-1.5 text-xs text-stone-700 hover:border-stone-500">{child.name}</Link>)}</nav>}
    <form action={href} className="mt-6 flex max-w-md gap-2"><input name="q" defaultValue={query} placeholder={`Search ${match.category.name}`} className="h-10 min-w-0 flex-1 rounded border border-stone-200 px-3 text-sm" /><button className="rounded bg-stone-900 px-4 text-xs text-white">Search</button></form>
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => { const card = toProductCardDTO(product); return <ProductCard key={card.id} product={card} />; })}</div>
    {!products.length && <p className="py-16 text-center text-sm text-stone-500">No products found in this category.</p>}
  </div></Container>;
}
