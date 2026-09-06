import type { Product } from "@/types/product";
import { mockProducts20 } from "@/Data/mockProducts";

export async function getProductDetails(slug: string): Promise<Product | undefined> {
  return mockProducts20.find((product) => product.slug === slug);
}