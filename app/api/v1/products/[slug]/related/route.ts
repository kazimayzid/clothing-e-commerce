import { mockProducts20 } from "@/Data/mockProducts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = mockProducts20.find(
    (product) => product.slug === slug
  );

  if (!product) {
    return Response.json(
      {
        success: false,
        message: "Product not found",
      },
      { status: 404 }
    );
  }

  // Current product বাদ
  const candidates = mockProducts20.filter(
    (item) => item.id !== product.id
  );

  const scoredProducts = candidates.map((candidate) => {
    let score = 0;

    // Category match → 50 points
    if (
      candidate.categoryName.toLowerCase() ===
      product.categoryName.toLowerCase()
    ) {
      score += 50;
    }

    // Gender match → 20 points
    if (
      candidate.gender.toLowerCase() ===
        product.gender.toLowerCase() ||
      candidate.gender.toLowerCase() === "unisex"
    ) {
      score += 20;
    }

    // Tags match → 10 points per matching tag
    const currentTags = product.tags ?? [];
    const candidateTags = candidate.tags ?? [];

    const matchedTags = candidateTags.filter((tag) =>
      currentTags.some(
        (currentTag) =>
          currentTag.toLowerCase() === tag.toLowerCase()
      )
    );

    score += Math.min(matchedTags.length * 10, 30);

    return {
      product: candidate,
      score,
    };
  });

  // Highest score first
  scoredProducts.sort((a, b) => b.score - a.score);

  // Top 4 related products
  const relatedProducts = scoredProducts
    .slice(0, 4)
    .map(({ product }) => product);

  return Response.json({
    success: true,
    data: relatedProducts,
  });
}