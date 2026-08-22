import { mockProducts20 } from "@/Data/mockProducts";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryGender = searchParams.get("gender");
  const querySearch = searchParams.get("search");
  const queryCategory = searchParams.get("category")


  let products = mockProducts20;

  if (queryGender) {
    const allowedGenders = [queryGender.toLowerCase(), "unisex"];
    products = products.filter((product) =>
      allowedGenders.includes(product.gender.toLowerCase()),
    );
  }

  if (querySearch) {
    products = products.filter(
      (product) =>
        product.title.toLowerCase().includes(querySearch.toLowerCase()) ||
        product.tags?.some((tag) =>
          tag.toLowerCase().includes(querySearch.toLowerCase()),
        ),
    );
  }

  if (queryCategory) {
    products = products.filter((product) => product.categoryName.toLowerCase().includes(queryCategory.toLowerCase()))
  }

  return Response.json(products);
}
