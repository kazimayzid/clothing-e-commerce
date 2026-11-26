import { prisma } from "@/lib/prisma";
import { adminProductInclude, toStorefrontProduct } from "@/lib/product-data";
import type { Product } from "@/types/product";
import { getProductCategoryPath } from "@/lib/product-category-service";

export async function getProductDetails(slug: string): Promise<Product | undefined> {
  const product = await prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: adminProductInclude,
  });
  if (!product) return undefined;
  const categoryPath = await getProductCategoryPath(product.categoryId, true);
  if (!categoryPath) return undefined;
  return toStorefrontProduct(product, categoryPath);
}
