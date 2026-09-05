import { mockProducts20 } from "@/Data/mockProducts";
import type { ProductDetailDTO } from "@/types/productDetails";

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
      {
        status: 404,
      }
    );
  }

  const mappedDTO: ProductDetailDTO = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    gender: product.gender,
    price: product.price,
    multibuyPrice: product.multibuyPrice,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    tags: product.tags,
    relatedProductIds: product.relatedProductIds,
    images: product.images,
    colorName: product.colorName,
    colors: product.colors,
    sizes: product.sizes,
    description: product.description,
    detailsAndCare: product.detailsAndCare,
    stockCount: product.stockCount,
    rating: product.rating,
    reviewCount: product.reviewCount,
  };

  return Response.json({
    success: true,
    data: mappedDTO,
  });
}