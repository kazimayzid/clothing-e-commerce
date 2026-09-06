import type { Product } from "@/types/product";

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(
    "http://localhost:3000/api/v1/products"
  );

  if (!res.ok) {
    throw new Error("Failed to fetch products data");
  }

  const response: { data: Product[] } = await res.json();

  return response.data;
}