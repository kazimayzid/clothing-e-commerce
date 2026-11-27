import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllCategoryRecords } from "@/lib/product-category-service";
import { getActiveCategoryIds, getDescendantCategoryIds, resolveCategoryPath } from "@/lib/category-tree";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug || slug.length > 120) return NextResponse.json({ success: false, error: "Category not found." }, { status: 404 });
  try {
    const categories = await getAllCategoryRecords();
    const activeIds = getActiveCategoryIds(categories);
    const category = categories.find((entry) => entry.slug === slug);
    if (!category || !activeIds.has(category.id)) {
      return NextResponse.json({ success: false, error: "Category not found." }, { status: 404 });
    }
    const children = categories.filter(({ parentId, id }) => parentId === category.id && activeIds.has(id))
      .map(({ id, name, slug: childSlug, description, sortOrder }) => ({ id, name, slug: childSlug, description, sortOrder: sortOrder ?? 0 }));
    const productCount = await prisma.product.count({
      where: {
        status: "PUBLISHED",
        categoryId: { in: getDescendantCategoryIds(category.id, categories).filter((id) => activeIds.has(id)) },
      },
    });
    const path = resolveCategoryPath(category.id, categories) ?? [];
    const data = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: category.sortOrder ?? 0,
      path,
      breadcrumbs: [
        { label: "Home", href: "/" },
        ...path.map((item, index) => ({
          label: item.name,
          href: `/categories/${path.slice(0, index + 1).map(({ slug: pathSlug }) => encodeURIComponent(pathSlug)).join("/")}`,
        })),
      ],
      children,
      productCount,
    };
    return NextResponse.json({ success: true, data }, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=15" },
    });
  } catch (error) {
    console.error("Public category detail request failed", error);
    return NextResponse.json({ success: false, error: "Could not load this category." }, { status: 500 });
  }
}
