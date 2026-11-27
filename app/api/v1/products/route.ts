import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllCategoryRecords } from "@/lib/product-category-service";
import { getActiveCategoryIds, resolveProductCategoryIds } from "@/lib/category-tree";
import { getPublicProductListing } from "@/lib/public-product-listing";

const filtersSchema = z.object({
  gender: z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]).optional(),
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(240).optional(),
  page: z.coerce.number().int().min(1).max(100_000).optional(),
  pageSize: z.coerce.number().int().min(1).max(1000).optional(),
  minPrice: z.string().regex(/^\d{1,8}(?:\.\d{1,2})?$/).optional(),
  maxPrice: z.string().regex(/^\d{1,8}(?:\.\d{1,2})?$/).optional(),
  sort: z.enum(["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc"]).optional(),
});

export async function GET(request: NextRequest) {
  const parsed = filtersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Product filters are invalid.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const filters = parsed.data;
  if (filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice)) {
    return NextResponse.json({ success: false, error: "Minimum price cannot exceed maximum price." }, { status: 400 });
  }
  let categoryIds: string[] | undefined;
  if (filters.category) {
    const categories = await getAllCategoryRecords();
    const activeIds = getActiveCategoryIds(categories);
    categoryIds = resolveProductCategoryIds(filters.category, categories, activeIds);
  }
  const pageSize = filters.pageSize ?? (filters.page ? 24 : 1000);
  try {
    const result = await getPublicProductListing({
      categoryIds,
      includeDescendants: true,
      gender: filters.gender,
      search: filters.search,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      page: filters.page ?? 1,
      pageSize,
      sort: filters.sort ?? "newest",
    });
    // Keep the existing flat array response for current storefront consumers.
    return paginatedResponse(result.products, result.pagination);
  } catch (error) {
    console.error("Public product listing request failed", error);
    return NextResponse.json({ success: false, error: "Could not load products." }, { status: 500 });
  }
}

function paginatedResponse(products: unknown[], pagination: { page: number; pageSize: number; total: number; totalPages: number }) {
  return NextResponse.json(products, { headers: {
    "Cache-Control": "public, max-age=0, s-maxage=15",
    "X-Total-Count": String(pagination.total),
    "X-Page": String(pagination.page),
    "X-Page-Size": String(pagination.pageSize),
    "X-Total-Pages": String(pagination.totalPages),
  } });
}
