import { NextResponse } from "next/server";
import { getProductDetails } from "@/services/productDetails.service";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductDetails(slug);
  if (!product) return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: product }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
