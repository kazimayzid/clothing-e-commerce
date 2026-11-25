import { prisma } from "@/lib/prisma";
import { adminProductInclude, toStorefrontProduct } from "@/lib/product-data";
import type { Gender, Product } from "@/types/product";

export async function getProducts(gender?: Gender): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      ...(gender ? { gender: gender.toUpperCase() as "MEN" | "WOMEN" | "UNISEX" | "KIDS" } : {}),
    },
    include: adminProductInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  return products.map(toStorefrontProduct);
}
