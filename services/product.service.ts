export async function getProducts() {
  const res = await fetch(
    "http://localhost:3000/api/v1/products",
  );
  
  if (!res.ok) {
    throw new Error("Failed to fetch products data");
  }

   const data = await res.json();
  return data;
}
