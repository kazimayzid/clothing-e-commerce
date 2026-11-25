import { prisma } from "@/lib/prisma";
import { adminProductInclude, toStorefrontProduct } from "@/lib/product-data";
import type { Product } from "@/types/product";

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
  const current = toStorefrontProduct(product);
  const candidates = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
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
  return candidates.map(toStorefrontProduct)
    .map((candidate) => ({ candidate, score: calculateSimilarityScore(current, candidate) }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 4)
    .map(({ candidate }) => candidate);
}

export async function getRelatedProduct(slug: string): Promise<{ success: boolean; data: Product[] }> {
  return { success: true, data: await getRelatedProducts(slug) };
}
