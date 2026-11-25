import { prisma } from "@/lib/prisma";
import { adminProductInclude, toStorefrontProduct } from "@/lib/product-data";
import type { Product } from "@/types/product";

export async function getProductDetails(slug: string): Promise<Product | undefined> {
  const product = await prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: adminProductInclude,
  });
  return product ? toStorefrontProduct(product) : undefined;
}
