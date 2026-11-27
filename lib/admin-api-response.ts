export async function readApiResponse(response: Response): Promise<Record<string, unknown>> {
  const body = await response.text();
  if (!body.trim()) throw new Error(`The server returned an empty response (HTTP ${response.status}).`);
  let data: unknown;
  try { data = JSON.parse(body); }
  catch { throw new Error(`The server returned an invalid response (HTTP ${response.status}).`); }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`The server returned an invalid response (HTTP ${response.status}).`);
  }
  return data as Record<string, unknown>;
}

export function apiResponseError(data: Record<string, unknown>, fallback: string) {
  return typeof data.error === "string" ? data.error : fallback;
}
