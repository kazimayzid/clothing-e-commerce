import { getProducts } from "@/services/product.service";
import Container from "./Container";
import ProductCard from "../product/ProductCard";

export default async function MenSection() {
  const products = await getProducts();


  return (
    <Container>
      <div className="mt-5">
        <h1 className="text-foreground/80 text-3xl">
          Men&apos;s T-Shirts
        </h1>

        <p className="text-muted">
          Charles Tyrwhitt men&apos;s shirts are world-famous for more than one
          reason: quality, perfect fit, and options. You’ll find a wide range
          of men’s shirts in our collection. You can take your pick from the
          many different colours, styles, and materials available.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </Container>
  );
}