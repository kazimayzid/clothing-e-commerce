import { getRelatedProduct } from "@/services/relatedProduct.service";
import ProductCard from "../product/ProductCard";

export default async function RelatedProducts({slug}: {slug: string}) {
    const data = await getRelatedProduct(slug)

    const relatedProducts = data.data
    
    return (
       
        <div className="my-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {relatedProducts.map((product) => (
            <ProductCard key={product.id}
        product={{
          id: String(product.id),
          title: product.title,
          price: `$${product.price}`,
          imageSrc: product.imageSrc,
        }} />
          ))}
        </div>
    )
}