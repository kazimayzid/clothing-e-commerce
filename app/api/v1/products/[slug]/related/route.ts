import { mockProducts20 } from "@/Data/mockProducts";
import { ResponseBuilder } from "@/lib/api-response";
import { getRelatedProducts } from "@/services/relatedProduct.service";


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

  const relatedProducts = getRelatedProducts(slug);

  return ResponseBuilder.success(relatedProducts);
}
