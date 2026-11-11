import type { Product } from "@/types/product";
import { mockProducts20 } from "@/Data/mockProducts";


export function calculateSimilarityScore(
  product: Product,
  candidate: Product
) {
  let score = 0;

  // Category match
  if (
    candidate.categoryName.toLowerCase() ===
    product.categoryName.toLowerCase()
  ) {
    score += 50;
  }

  // Gender match
  if (
    candidate.gender.toLowerCase() ===
      product.gender.toLowerCase() ||
    candidate.gender.toLowerCase() === "unisex"
  ) {
    score += 20;
  }

  // Tags match
  const currentTags = product.tags ?? [];
  const candidateTags = candidate.tags ?? [];

  const matchedTags = candidateTags.filter((tag) =>
    currentTags.some(
      (currentTag) =>
        currentTag.toLowerCase() === tag.toLowerCase()
    )
  );

  score += Math.min(matchedTags.length * 10, 30);

  return score;
}


export function getRelatedProducts(slug: string): Product[] {
  const product = mockProducts20.find((item) => item.slug === slug);

  if (!product) return [];

  return mockProducts20
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => ({
      product: candidate,
      score: calculateSimilarityScore(product, candidate),
    }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 4)
    .map(({ product: relatedProduct }) => relatedProduct);
}

export async function getRelatedProduct(
  slug: string
): Promise<{ success: boolean; data: Product[] }> {
  return { success: true, data: getRelatedProducts(slug) };
}
