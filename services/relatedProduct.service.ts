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


export async function getRelatedProduct(
  slug: string
): Promise<{ success: boolean; data: Product[] }> {
  const res = await fetch(
    `http://localhost:3000/api/v1/products/${slug}/related`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch related products");
  }

  return res.json();
}