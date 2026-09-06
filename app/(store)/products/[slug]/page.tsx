
import Container from "@/components/layout/Container";
import ProductDetails from "@/components/localUI/ProductDetails";
import ProductGallery from "@/components/shared/ProductGallery";
import { getProductDetails } from "@/services/productDetails.service";
import type { ProductDetailDTO } from "@/types/productDetails";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const product: ProductDetailDTO | undefined =
    await getProductDetails(slug);

  // Product না পেলে 404 page দেখাবে
  if (!product) {
    notFound();
  }

  return (
    <Container>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 py-8">
        <ProductGallery
          images={product.images}
          title={product.title}
        />

        <ProductDetails
          title={product.title}
          price={product.price}
          rating={product.rating}
          reviewCount={product.reviewCount}
          description={product.description}
          colors={product.colors}
          sizes={product.sizes}
        />
      </div>
    </Container>
  );
}

