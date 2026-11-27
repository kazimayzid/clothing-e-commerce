import assert from "node:assert/strict";
import test from "node:test";
import { getInitialGalleryImage, getVariantGalleryFocus, getVariantUnitPrice, getVariantCartLineId, getVariantGallery, selectColorVariant, selectSizeVariant } from "../lib/product-selection";
import { canAddVariantQuantity, createProductSchema } from "../lib/product-validation";
import type { ProductVariantOption } from "../types/product";

const variants: ProductVariantOption[] = [
  { id: "red-s", name: "Red / S", sku: "TEE-RED-S", size: "S", colorName: "Red", colorHex: "#ff0000", price: "20.00", stockQuantity: 3, isActive: true, images: ["red-front.jpg", "red-back.jpg"] },
  { id: "blue-s", name: "Blue / S", sku: "TEE-BLUE-S", size: "S", colorName: "Blue", colorHex: "#0000ff", price: "22.00", stockQuantity: 0, isActive: true, images: ["blue-front.jpg"] },
  { id: "blue-m", name: "Blue / M", sku: "TEE-BLUE-M", size: "M", colorName: "Blue", colorHex: "#0000ff", price: "22.00", stockQuantity: 5, isActive: true, images: [] },
];

test("selecting a color resolves the matching size variant and its gallery, SKU, price, and stock", () => {
  const red = selectColorVariant(variants, "Red", "S");
  assert.equal(red?.id, "red-s");
  assert.deepEqual(getVariantGallery(red, ["common.jpg"]), ["common.jpg", "red-front.jpg", "red-back.jpg"]);
  assert.equal(red?.sku, "TEE-RED-S");
  assert.equal(getVariantUnitPrice("18.00", red?.price ?? null), "20.00");
  assert.equal(red?.stockQuantity, 3);

  const blue = selectColorVariant(variants, "Blue", "S");
  assert.equal(blue?.id, "blue-s");
  assert.deepEqual(getVariantGallery(blue, ["common.jpg"]), ["common.jpg", "blue-front.jpg"]);
  assert.equal(blue?.sku, "TEE-BLUE-S");
  assert.equal(blue?.price, "22.00");
  assert.equal(blue?.stockQuantity, 0);
});

test("variant without images falls back to the common product gallery", () => {
  const variant = selectSizeVariant(variants, "M", "Blue");
  assert.deepEqual(getVariantGallery(variant, ["common-1.jpg", "common-2.jpg"]), ["common-1.jpg", "common-2.jpg"]);
});

test("initial gallery prefers the common primary; variant changes focus the exact variant image", () => {
  const red = { ...variants[0], primaryImageSrc: "red-back.jpg" };
  assert.equal(getInitialGalleryImage(red, ["common.jpg", "common-2.jpg"], "common.jpg"), "common.jpg");
  assert.equal(getInitialGalleryImage(red, ["common.jpg"], undefined), "red-back.jpg");
  assert.equal(getVariantGalleryFocus(red, ["common.jpg"], "common.jpg"), "red-back.jpg");
  assert.equal(getVariantGalleryFocus(variants[2], ["common.jpg"], "common.jpg"), "common.jpg");
  assert.equal(getInitialGalleryImage(undefined, [], undefined), "");
  assert.deepEqual(getVariantGallery({ images: ["shared.jpg"] }, ["shared.jpg"]), ["shared.jpg"]);
});

test("variant selection never silently substitutes a different size or color", () => {
  assert.equal(selectColorVariant(variants, "Red", "M"), undefined);
  assert.equal(selectSizeVariant(variants, "M", "Red"), undefined);
});

test("cart quantity validation rejects inactive and insufficient-stock variants", () => {
  assert.equal(canAddVariantQuantity(true, 2, 2), true);
  assert.equal(canAddVariantQuantity(true, 2, 3), false);
  assert.equal(canAddVariantQuantity(false, 9, 1), false);
});

test("cart lines keep different variants of one product separate", () => {
  assert.notEqual(getVariantCartLineId("product-1", "red-s"), getVariantCartLineId("product-1", "blue-m"));
  assert.equal(getVariantCartLineId("product-1", "red-s"), "product-1:red-s");
});

test("published products can use variant images without common images", () => {
  const product = {
    title: "Linen Tee", slug: "linen-tee", description: "A tee", detailsAndCare: [], gender: "UNISEX",
    categoryId: "39b8ab31-bcb0-487c-a318-2a11e44ef318", price: "20.00", multibuyPrice: null, currency: "GBP", status: "PUBLISHED",
    tags: [], isNew: false, bestsellerRank: null, variants: [{ name: "Red", images: [{ id: "a1c044b3-2f40-49c2-8a61-fdad63882ac8" }], primaryImageId: "a1c044b3-2f40-49c2-8a61-fdad63882ac8" }],
    images: [], primaryImageId: null,
  };
  assert.equal(createProductSchema.safeParse(product).success, true);
});
