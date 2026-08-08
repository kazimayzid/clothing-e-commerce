export async function getProducts() {
  const res = await fetch(
    "https://dummyjson.com/products/category/mens-shirts",
  );
  
  if (!res.ok) {
    throw new Error("Failed to fetch products data");
  }

  return res.json();
}
