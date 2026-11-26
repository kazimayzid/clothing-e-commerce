
import Container from "@/components/layout/Container";
import ProductDetailExperience from "@/components/product/ProductDetailExperience";
import RelatedProducts from "@/components/localUI/RelatedProducts";
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
        <ProductDetailExperience product={product} />
      </div>

      <hr className="text-foreground/20"/>

      <h1 className="pt-2 text-2xl font-medium text-foreground/80">You may also like...</h1>

      <RelatedProducts slug={slug}/>
    </Container>
  );
}

