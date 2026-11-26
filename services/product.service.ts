import { prisma } from "@/lib/prisma";
import { adminProductInclude, toStorefrontProduct } from "@/lib/product-data";
import type { Gender, Product } from "@/types/product";
import { getAllCategoryRecords } from "@/lib/product-category-service";
import { isActiveCategoryPath, resolveCategoryPath } from "@/lib/category-tree";

export async function getProducts(gender?: Gender): Promise<Product[]> {
  const categories = await getAllCategoryRecords();
  const activeCategoryIds = categories.filter(({ id }) => isActiveCategoryPath(id, categories)).map(({ id }) => id);
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: { in: activeCategoryIds },
      ...(gender ? { gender: gender.toUpperCase() as "MEN" | "WOMEN" | "UNISEX" | "KIDS" } : {}),
    },
    include: adminProductInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  const pathById = new Map(categories.map((category) => [category.id, resolveCategoryPath(category.id, categories)]));
  return products.map((product) => toStorefrontProduct(product, pathById.get(product.categoryId) ?? undefined));
}
