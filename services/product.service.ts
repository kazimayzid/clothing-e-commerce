import type { Product } from "@/types/product";
import { mockProducts20 } from "@/Data/mockProducts";

export async function getProducts(): Promise<Product[]> {
  return mockProducts20;
}