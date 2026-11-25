import { NextResponse } from "next/server";
import { getRelatedProduct } from "@/services/relatedProduct.service";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getRelatedProduct(slug);
  return NextResponse.json(products, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
