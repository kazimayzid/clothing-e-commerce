import ProductGallery from "@/components/shared/ProductGallery";
import { getProductDetails } from "@/services/productDetails.service";
import type { ProductDetailDTO } from "@/types/productDetails";

interface PageProps {
    params: Promise<{slug: string}>
}

export default async function ProductDetailPage({params}: PageProps) {
    const {slug} = await params
    const product: ProductDetailDTO | undefined = await getProductDetails(slug);

    return (
        <>
          {product && <ProductGallery images={product.images} title={product.title} />}
        </>
    )
}