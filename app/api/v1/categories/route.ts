import { NextResponse } from "next/server";
import { getPublicCategoryTree } from "@/lib/product-category-service";

export async function GET() {
  try {
    const data = await getPublicCategoryTree();
    return NextResponse.json({ success: true, data }, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=15" },
    });
  } catch (error) {
    console.error("Public category tree request failed", error);
    return NextResponse.json({ success: false, error: "Could not load categories." }, { status: 500 });
  }
}
