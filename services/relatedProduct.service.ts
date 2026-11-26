import { prisma } from "@/lib/prisma";
import { adminProductInclude, toStorefrontProduct } from "@/lib/product-data";
import type { Product } from "@/types/product";
import { getAllCategoryRecords } from "@/lib/product-category-service";
import { isActiveCategoryPath, resolveCategoryPath } from "@/lib/category-tree";

export function calculateSimilarityScore(product: Product, candidate: Product) {
  let score = product.categoryId === candidate.categoryId ? 50 : 0;
  if (candidate.gender === product.gender || candidate.gender === "unisex") score += 20;
  const matchedTags = (candidate.tags ?? []).filter((tag) =>
    (product.tags ?? []).some((currentTag) => currentTag.toLowerCase() === tag.toLowerCase()),
  );
  return score + Math.min(matchedTags.length * 10, 30);
}

export async function getRelatedProducts(slug: string): Promise<Product[]> {
  const product = await prisma.product.findFirst({ where: { slug, status: "PUBLISHED" }, include: adminProductInclude });
  if (!product) return [];
  const categories = await getAllCategoryRecords();
  const activeCategoryIds = categories.filter(({ id }) => isActiveCategoryPath(id, categories)).map(({ id }) => id);
  const pathById = new Map(categories.map(({ id }) => [id, resolveCategoryPath(id, categories)]));
  if (!activeCategoryIds.includes(product.categoryId)) return [];
  const current = toStorefrontProduct(product, pathById.get(product.categoryId) ?? undefined);
  const candidates = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: { in: activeCategoryIds },
      id: { not: product.id },
      OR: [
        { categoryId: product.categoryId },
        { gender: product.gender },
        ...(product.tags.length ? [{ tags: { hasSome: product.tags } }] : []),
      ],
    },
    include: adminProductInclude,
    take: 40,
  });
  return candidates.map((candidate) => toStorefrontProduct(candidate, pathById.get(candidate.categoryId) ?? undefined))
    .map((candidate) => ({ candidate, score: calculateSimilarityScore(current, candidate) }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 4)
    .map(({ candidate }) => candidate);
}

export async function getRelatedProduct(slug: string): Promise<{ success: boolean; data: Product[] }> {
  return { success: true, data: await getRelatedProducts(slug) };
}
