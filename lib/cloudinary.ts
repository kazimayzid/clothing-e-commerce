import "server-only";

import { createHash, randomUUID } from "node:crypto";

const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_FORMATS = ["jpg", "png", "webp", "avif"] as const;

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export class ProductImageError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "ProductImageError";
  }
}

function getConfig(): CloudinaryConfig {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = process.env;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ProductImageError("Product image storage is not configured.", 503);
  }
  return { cloudName, apiKey, apiSecret };
}

function signature(params: Record<string, string>, apiSecret: string) {
  const serialized = Object.entries(params)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

function detectFormat(bytes: Uint8Array): (typeof IMAGE_FORMATS)[number] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp") {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (brand === "avif" || brand === "avis") return "avif";
  }
  return null;
}

export async function uploadProductImage(file: File, userId: string) {
  if (file.size <= 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new ProductImageError("Image must be between 1 byte and 5 MB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = detectFormat(bytes);
  if (!format || file.type !== `image/${format === "jpg" ? "jpeg" : format}`) {
    throw new ProductImageError("Only valid JPEG, PNG, WebP, or AVIF images are supported.");
  }

  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = `products/staging/${userId}`;
  const publicId = randomUUID();
  const signedParams = {
    allowed_formats: IMAGE_FORMATS.join(","),
    folder,
    overwrite: "false",
    public_id: publicId,
    timestamp,
  };
  const body = new FormData();
  body.set("file", new Blob([bytes], { type: file.type }), `product-image.${format}`);
  body.set("api_key", config.apiKey);
  body.set("signature", signature(signedParams, config.apiSecret));
  for (const [key, value] of Object.entries(signedParams)) body.set(key, value);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
    method: "POST",
    body,
    cache: "no-store",
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok || !result || typeof result !== "object" || !("secure_url" in result) || !("public_id" in result) || !("format" in result)) {
    throw new ProductImageError("Cloudinary could not store this image. Check the provider configuration and try again.", 502);
  }
  const uploaded = result as { secure_url: unknown; public_id: unknown; format: unknown };
  if (typeof uploaded.secure_url !== "string" || typeof uploaded.public_id !== "string" || typeof uploaded.format !== "string") {
    throw new ProductImageError("Cloudinary returned an invalid image response.", 502);
  }
  return { secureUrl: uploaded.secure_url, publicId: uploaded.public_id, format: uploaded.format };
}

export async function destroyProductImage(publicId: string) {
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParams = { invalidate: "true", public_id: publicId, timestamp };
  const body = new URLSearchParams({
    ...signedParams,
    api_key: config.apiKey,
    signature: signature(signedParams, config.apiSecret),
  });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok || !result || typeof result !== "object" || !("result" in result) || result.result !== "ok" && result.result !== "not found") {
    throw new ProductImageError("Cloudinary could not remove the image.", 502);
  }
}

export const PRODUCT_IMAGE_MAX_BYTES = MAX_PRODUCT_IMAGE_BYTES;
