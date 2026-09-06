import type { Product } from "@/types/product";

export async function getProductDetails(slug: string): Promise<Product | undefined> {
	const res = await fetch(`http://localhost:3000/api/v1/products/${slug}`);

	if (!res.ok) {
		throw new Error("Failed to fetch product details");
	}

	const response: { data?: Product } = await res.json();
	
	return response.data;
}