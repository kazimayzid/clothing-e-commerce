import { mockProducts20 } from "@/Data/mockProducts";
import { ResponseBuilder } from "@/lib/api-response";
import { calculateSimilarityScore } from "@/services/relatedProduct.service";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = mockProducts20.find(
    (product) => product.slug === slug
  );

  if (!product) {
    return ResponseBuilder.error(
      "Product not found",
      404,
      "PRODUCT_NOT_FOUND"
    );
  }

  const candidates = mockProducts20.filter(
    (item) => item.id !== product.id
  );

  const scoredProducts = candidates.map((candidate) => ({
    product: candidate,
    score: calculateSimilarityScore(product, candidate),
  }));

  scoredProducts.sort((a, b) => b.score - a.score);

  const relatedProducts = scoredProducts
    .slice(0, 4)
    .map(({ product }) => product);

  return ResponseBuilder.success(relatedProducts);
}