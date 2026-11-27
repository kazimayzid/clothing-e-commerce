import assert from "node:assert/strict";
import test from "node:test";
import { executePermanentProductDelete, getProductDeleteBlock, isProductDeleteForeignKeyError, ProductDeletionBlockedError } from "../lib/product-delete-policy";

test("only archived products can enter permanent deletion", () => {
  assert.equal(getProductDeleteBlock({ status: "ARCHIVED", archivedAt: new Date("2026-01-01") }), null);
  assert.equal(getProductDeleteBlock({ status: "PUBLISHED", archivedAt: null }), "PRODUCT_NOT_ARCHIVED");
  assert.equal(getProductDeleteBlock({ status: "DRAFT", archivedAt: null }), "PRODUCT_NOT_ARCHIVED");
  assert.equal(getProductDeleteBlock({ status: "ARCHIVED", archivedAt: null }), "PRODUCT_NOT_ARCHIVED");
});

test("eligible product deletion audits first, then removes only product-owned rows", async () => {
  const state = { audit: [] as string[], product: true, variants: ["v1"], images: ["i1"], orders: ["historical-order-item"] };
  await executePermanentProductDelete({ status: "ARCHIVED", archivedAt: new Date("2026-01-01") }, {
    writeAudit: async () => { state.audit.push("products.deleted_permanently"); },
    deleteImages: async () => { state.images = []; },
    deleteVariants: async () => { state.variants = []; },
    deleteProduct: async () => { state.product = false; },
  });
  assert.deepEqual(state, { audit: ["products.deleted_permanently"], product: false, variants: [], images: [], orders: ["historical-order-item"] });
});

test("active-product rejection makes no audit or deletion calls", async () => {
  let calls = 0;
  await assert.rejects(executePermanentProductDelete({ status: "PUBLISHED", archivedAt: null }, {
    writeAudit: async () => { calls += 1; },
    deleteImages: async () => { calls += 1; },
    deleteVariants: async () => { calls += 1; },
    deleteProduct: async () => { calls += 1; },
  }), (error: unknown) => error instanceof ProductDeletionBlockedError && error.block === "PRODUCT_NOT_ARCHIVED");
  assert.equal(calls, 0);
});

test("database foreign-key references are recognized as protected product dependencies", () => {
  assert.equal(isProductDeleteForeignKeyError({ code: "P2003" }), true);
  assert.equal(isProductDeleteForeignKeyError({ code: "P2025" }), false);
});

test("transaction failure can roll back audit and product-owned child deletions", async () => {
  const state = { audit: [] as string[], product: true, variants: ["v1"], images: ["i1"] };
  const transaction = async (work: () => Promise<unknown>) => {
    const snapshot = structuredClone(state);
    try { await work(); }
    catch (error) {
      state.audit = snapshot.audit;
      state.product = snapshot.product;
      state.variants = snapshot.variants;
      state.images = snapshot.images;
      throw error;
    }
  };
  await assert.rejects(transaction(() => executePermanentProductDelete({ status: "ARCHIVED", archivedAt: new Date() }, {
    writeAudit: async () => { state.audit.push("products.deleted_permanently"); },
    deleteImages: async () => { state.images = []; },
    deleteVariants: async () => { state.variants = []; },
    deleteProduct: async () => { throw { code: "P2003" }; },
  })), (error: unknown) => isProductDeleteForeignKeyError(error));
  assert.deepEqual(state, { audit: [], product: true, variants: ["v1"], images: ["i1"] });
});
