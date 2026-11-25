import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { adminProductInclude, toProductCardDTO } from "@/lib/product-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const genderParam = searchParams.get("gender")?.toUpperCase();
  const gender = ["MEN", "WOMEN", "UNISEX", "KIDS"].includes(genderParam ?? "") ? genderParam : undefined;
  const query = searchParams.get("search")?.trim().slice(0, 100);
  const category = searchParams.get("category")?.trim().slice(0, 100);
  const clauses: Prisma.ProductWhereInput[] = [];
  if (gender) clauses.push({ OR: [
    { gender: gender as "MEN" | "WOMEN" | "UNISEX" | "KIDS" },
    { gender: "UNISEX" },
  ] });
  if (query) clauses.push({ OR: [
    { title: { contains: query, mode: "insensitive" } },
    { slug: { contains: query, mode: "insensitive" } },
    { tags: { has: query.toLowerCase() } },
  ] });
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category: { name: { contains: category, mode: "insensitive" } } } : {}),
      ...(clauses.length ? { AND: clauses } : {}),
    },
    include: adminProductInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 1000,
  });
  const response = products.map(toProductCardDTO);
  return NextResponse.json(response, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
