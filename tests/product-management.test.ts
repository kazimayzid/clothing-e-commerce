import assert from "node:assert/strict";
import test from "node:test";
import {
  canSetVariantStock,
  createProductSchema,
  hasAvailableStock,
  slugifyProductName,
  updateProductSchema,
} from "../lib/product-validation";

const validProduct = {
  title: "Linen Shirt",
  slug: "linen-shirt",
  description: "A breathable shirt.",
  detailsAndCare: ["Wash at 30 degrees"],
  gender: "MEN",
  categoryId: "39b8ab31-bcb0-487c-a318-2a11e44ef318",
  price: "59.90",
  multibuyPrice: "39.00",
  currency: "GBP",
  status: "DRAFT",
  tags: ["linen", "summer"],
  isNew: false,
  bestsellerRank: null,
  variants: [{ name: "Blue / M", sku: "linen-blue-m", size: "M", colorName: "Blue", colorHex: "#123ABC", priceOverride: null, stockQuantity: 0 }],
  images: [],
  primaryImageId: null,
} as const;

test("product creation validates decimal money and draft products may be image-free", () => {
  assert.equal(createProductSchema.safeParse(validProduct).success, true);
  assert.equal(createProductSchema.safeParse({ ...validProduct, price: "59.999" }).success, false);
});

test("publishing requires an image and multibuy price must be lower", () => {
  const publishedWithoutImage = createProductSchema.safeParse({ ...validProduct, status: "PUBLISHED" });
  assert.equal(publishedWithoutImage.success, false);
  assert.equal(createProductSchema.safeParse({ ...validProduct, price: "39.00", multibuyPrice: "39.00" }).success, false);
});

test("partial product updates do not require or reset omitted fields", () => {
  assert.deepEqual(updateProductSchema.parse({ title: "Updated title" }), { title: "Updated title" });
});

test("product slugs are normalized consistently", () => {
  assert.equal(slugifyProductName("  Pure Linen — Shirt! "), "pure-linen-shirt");
  assert.equal(slugifyProductName("   "), "");
});

test("stock writes require inventory permission and stock availability uses active variants", () => {
  assert.equal(canSetVariantStock(false, 0), true);
  assert.equal(canSetVariantStock(false, 4), false);
  assert.equal(canSetVariantStock(false, 5, 5), true);
  assert.equal(canSetVariantStock(false, 6, 5), false);
  assert.equal(canSetVariantStock(true, 6, 5), true);
  assert.equal(hasAvailableStock([{ isActive: false, stockQuantity: 9 }]), false);
  assert.equal(hasAvailableStock([{ isActive: true, stockQuantity: 1 }]), true);
});
