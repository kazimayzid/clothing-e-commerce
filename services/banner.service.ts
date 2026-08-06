export async function getBannerData() {
  const res = await fetch(
    "https://api.pexels.com/v1/videos/search?query=fashion&orientation=landscape&size=medium",
    {
      headers: {
        Authorization: process.env.PEXELS_API_KEY ?? "",
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch banner data");
  }

  return res.json();
}