import assert from "node:assert/strict";
import test from "node:test";
import { buildCategoryTree, getDescendantCategoryIds, isActiveCategoryPath, resolveCategoryPath, wouldCreateCategoryCycle } from "../lib/category-tree";

const categories = [
  { id: "a", name: "Clothing", slug: "clothing", description: null, parentId: null, archivedAt: null },
  { id: "b", name: "Women", slug: "women", description: null, parentId: "a", archivedAt: null },
  { id: "c", name: "Dresses", slug: "dresses", description: null, parentId: "b", archivedAt: null },
  { id: "d", name: "Archived", slug: "archived", description: null, parentId: "a", archivedAt: new Date() },
];

test("category hierarchy resolves deep breadcrumb paths and descendants", () => {
  assert.deepEqual(resolveCategoryPath("c", categories)?.map(({ slug }) => slug), ["clothing", "women", "dresses"]);
  assert.deepEqual(new Set(getDescendantCategoryIds("b", categories)), new Set(["b", "c"]));
  assert.equal(buildCategoryTree(categories).length, 1);
  assert.equal(isActiveCategoryPath("c", categories), true);
  assert.equal(isActiveCategoryPath("d", categories), false);
});

test("category reparenting prevents self and descendant cycles", () => {
  assert.equal(wouldCreateCategoryCycle("a", "c", categories), true);
  assert.equal(wouldCreateCategoryCycle("b", "b", categories), true);
  assert.equal(wouldCreateCategoryCycle("c", "a", categories), false);
});
