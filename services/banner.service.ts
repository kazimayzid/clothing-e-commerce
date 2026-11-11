export async function getBannerData() {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) return null;

  try {
    const res = await fetch(
      "https://api.pexels.com/v1/videos/search?query=fashion&orientation=landscape&size=medium",
      {
        headers: { Authorization: apiKey },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(3000),
      },
    );

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}
