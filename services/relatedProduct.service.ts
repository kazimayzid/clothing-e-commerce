import type { Product } from "@/types/product";

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