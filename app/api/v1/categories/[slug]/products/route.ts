import { NextResponse } from "next/server";
import { getAllCategoryRecords } from "@/lib/product-category-service";
import { isActiveCategoryPath } from "@/lib/category-tree";
import { getPublicProductListing } from "@/lib/public-product-listing";
import { publicCategoryProductsQuerySchema } from "@/lib/public-product-listing-query";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug || slug.length > 120) return NextResponse.json({ success: false, error: "Category not found." }, { status: 404 });
  const parsed = publicCategoryProductsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Product filters are invalid.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const input = parsed.data;
  if (input.minPrice && input.maxPrice && Number(input.minPrice) > Number(input.maxPrice)) {
    return NextResponse.json({ success: false, error: "Minimum price cannot exceed maximum price." }, { status: 400 });
  }
  try {
    const categories = await getAllCategoryRecords();
    const category = categories.find((entry) => entry.slug === slug);
    if (!category || !isActiveCategoryPath(category.id, categories)) {
      return NextResponse.json({ success: false, error: "Category not found." }, { status: 404 });
    }
    const result = await getPublicProductListing({ ...input, categoryId: category.id, includeDescendants: true });
    return NextResponse.json({ success: true, data: result.products, pagination: result.pagination }, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=15" },
    });
  } catch (error) {
    console.error("Category products request failed", error);
    return NextResponse.json({ success: false, error: "Could not load products for this category." }, { status: 500 });
  }
}
