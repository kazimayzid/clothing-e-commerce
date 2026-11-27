import assert from "node:assert/strict";
import test from "node:test";
import { CategoryDeletionBlockedError, executePermanentCategoryDelete, getCategoryDeleteBlock } from "../lib/category-delete-policy";

test("permanent deletion is eligible only for an archived category without products or children", () => {
  assert.equal(getCategoryDeleteBlock({ archivedAt: new Date("2026-01-01"), productCount: 0, childCount: 0 }), null);
  assert.equal(getCategoryDeleteBlock({ archivedAt: null, productCount: 0, childCount: 0 }), "CATEGORY_ACTIVE");
  assert.equal(getCategoryDeleteBlock({ archivedAt: new Date("2026-01-01"), productCount: 1, childCount: 0 }), "PRODUCTS_ASSIGNED");
  assert.equal(getCategoryDeleteBlock({ archivedAt: new Date("2026-01-01"), productCount: 0, childCount: 1 }), "CHILD_CATEGORIES");
});

test("safe permanent deletion writes the audit before deleting and never touches product or order records", async () => {
  const products = [{ id: "product-1", categoryId: "category-1" }];
  const orders = [{ id: "order-1", productId: "product-1" }];
  const calls: string[] = [];
  await executePermanentCategoryDelete({ archivedAt: new Date("2026-01-01"), productCount: 0, childCount: 0 }, {
    writeAudit: async () => { calls.push("audit"); },
    deleteCategory: async () => { calls.push("delete-category"); },
  });
  assert.deepEqual(calls, ["audit", "delete-category"]);
  assert.deepEqual(products, [{ id: "product-1", categoryId: "category-1" }]);
  assert.deepEqual(orders, [{ id: "order-1", productId: "product-1" }]);
});

test("blocked permanent deletion does not write an audit success or call delete", async () => {
  let auditWrites = 0;
  let deletes = 0;
  await assert.rejects(executePermanentCategoryDelete({ archivedAt: null, productCount: 0, childCount: 0 }, {
    writeAudit: async () => { auditWrites += 1; },
    deleteCategory: async () => { deletes += 1; },
  }), (error: unknown) => error instanceof CategoryDeletionBlockedError && error.block === "CATEGORY_ACTIVE");
  assert.equal(auditWrites, 0);
  assert.equal(deletes, 0);
});
