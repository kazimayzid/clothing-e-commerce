import { mockProducts20 } from "@/Data/mockProducts";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryGender = searchParams.get("gender");
  const querySearch = searchParams.get("search");

  let products = mockProducts20;

  if (queryGender) {
    products = products.filter((product) =>
      product.gender.includes(queryGender),
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

  return Response.json(products);
}
