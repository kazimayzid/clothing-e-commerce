import assert from "node:assert/strict";
import test from "node:test";
import { createProductCategorySchema, updateProductCategorySchema } from "../lib/product-validation";
import { publicCategoryProductsQuerySchema } from "../lib/public-product-listing-query";
import { buildCategoryTree, buildPublicCategoryTree, categoryPathHref, getActiveCategoryIds, getDescendantCategoryIds, isActiveCategoryPath, matchCategorySlugPath, resolveCategoryPath, resolveProductCategoryIds, wouldCreateCategoryCycle } from "../lib/category-tree";

const categories = [
  { id: "a", name: "Clothing", slug: "clothing", description: null, parentId: null, archivedAt: null, sortOrder: 0 },
  { id: "b", name: "Women", slug: "women", description: null, parentId: "a", archivedAt: null, sortOrder: 0 },
  { id: "c", name: "Dresses", slug: "dresses", description: null, parentId: "b", archivedAt: null, sortOrder: 0 },
  { id: "d", name: "Archived", slug: "archived", description: null, parentId: "a", archivedAt: new Date(), sortOrder: 2 },
  { id: "e", name: "Men", slug: "men", description: null, parentId: "a", archivedAt: null, sortOrder: 1 },
];

test("category hierarchy resolves deep breadcrumb paths and descendants", () => {
  assert.deepEqual(resolveCategoryPath("c", categories)?.map(({ slug }) => slug), ["clothing", "women", "dresses"]);
  assert.deepEqual(new Set(getDescendantCategoryIds("b", categories)), new Set(["b", "c"]));
  assert.equal(buildCategoryTree(categories).length, 1);
  assert.equal(isActiveCategoryPath("c", categories), true);
  assert.equal(isActiveCategoryPath("d", categories), false);
  assert.equal(matchCategorySlugPath(["clothing", "women", "dresses"], categories)?.category.id, "c");
  assert.equal(matchCategorySlugPath(["archived"], categories), null);
  assert.equal(categoryPathHref(resolveCategoryPath("c", categories) ?? []), "/categories/clothing/women/dresses");
  assert.deepEqual(buildCategoryTree(categories)[0]?.children.map(({ name }) => name), ["Women", "Men"]);
  const publicTree = buildPublicCategoryTree(categories);
  assert.deepEqual(publicTree[0]?.children.map(({ name }) => name), ["Women", "Men"]);
  assert.equal("archivedAt" in (publicTree[0] ?? {}), false);
  assert.deepEqual(publicTree[0]?.children[0]?.children[0]?.name, "Dresses");
});

test("product category filtering supports hierarchy paths and legacy partial category names", () => {
  const active = getActiveCategoryIds(categories);
  assert.deepEqual(resolveProductCategoryIds("clothing/women/dresses", categories, active), ["c"]);
  assert.deepEqual(new Set(resolveProductCategoryIds("women", categories, active)), new Set(["b", "c"]));
  assert.deepEqual(resolveProductCategoryIds("archived", categories, active), []);
  assert.deepEqual(resolveProductCategoryIds("missing", categories, active), []);
});

test("category reparenting prevents self and descendant cycles", () => {
  assert.equal(wouldCreateCategoryCycle("a", "c", categories), true);
  assert.equal(wouldCreateCategoryCycle("b", "b", categories), true);
  assert.equal(wouldCreateCategoryCycle("c", "a", categories), false);
});

test("archived ancestors, orphan paths, and cycles are not publicly active", () => {
  const invalid = [
    { id: "archived-root", name: "Archived", slug: "archived", description: null, parentId: null, archivedAt: new Date(), sortOrder: 0 },
    { id: "child", name: "Child", slug: "child", description: null, parentId: "archived-root", archivedAt: null, sortOrder: 0 },
    { id: "orphan", name: "Orphan", slug: "orphan", description: null, parentId: "missing", archivedAt: null, sortOrder: 0 },
    { id: "cycle-a", name: "A", slug: "a", description: null, parentId: "cycle-b", archivedAt: null, sortOrder: 0 },
    { id: "cycle-b", name: "B", slug: "b", description: null, parentId: "cycle-a", archivedAt: null, sortOrder: 0 },
  ];
  assert.deepEqual(getActiveCategoryIds(invalid), new Set());
  assert.deepEqual(buildPublicCategoryTree(invalid), []);
  assert.equal(resolveCategoryPath("orphan", invalid), null);
});

test("root and nested category payloads accept controlled sort order and reject invalid parents", () => {
  const root = createProductCategorySchema.safeParse({ name: "Leather Goods", slug: "leather-goods", sortOrder: 2 });
  const nested = createProductCategorySchema.safeParse({ name: "Totes", slug: "totes", parentId: "39b8ab31-bcb0-487c-a318-2a11e44ef318", sortOrder: -1 });
  assert.equal(root.success, true);
  assert.equal(nested.success, true);
  assert.equal(updateProductCategorySchema.safeParse({ parentId: "not-a-uuid" }).success, false);
  assert.equal(createProductCategorySchema.safeParse({ name: "Totes", slug: "totes", sortOrder: 1.5 }).success, false);
});

test("public category product filters default and validate bounded pagination and sorting", () => {
  assert.deepEqual(publicCategoryProductsQuerySchema.parse({}), { page: 1, pageSize: 24, sort: "newest" });
  const filters = publicCategoryProductsQuerySchema.parse({ page: "3", pageSize: "18", sort: "price_asc", gender: "WOMEN", search: "linen" });
  assert.equal(filters.page, 3);
  assert.equal(filters.pageSize, 18);
  assert.equal(filters.sort, "price_asc");
  assert.equal(publicCategoryProductsQuerySchema.safeParse({ pageSize: "61" }).success, false);
  assert.equal(publicCategoryProductsQuerySchema.safeParse({ sort: "random" }).success, false);
});
