import "server-only";

import { prisma } from "@/lib/prisma";
import {
  buildCategoryTree,
  categoryPathHref,
  isActiveCategoryPath,
  resolveCategoryPath,
  type CategoryPathItem,
  type CategoryRecord,
  type CategoryTreeNode,
} from "@/lib/category-tree";

export async function getAllCategoryRecords(): Promise<CategoryRecord[]> {
  return prisma.productCategory.findMany({
    select: { id: true, name: true, slug: true, description: true, parentId: true, archivedAt: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export async function getProductCategoryPath(categoryId: string, publicOnly = false): Promise<CategoryPathItem[] | null> {
  const categories = await getAllCategoryRecords();
  const path = resolveCategoryPath(categoryId, categories);
  if (!path) return null;
  if (publicOnly && path.some(({ id }) => categories.find((category) => category.id === id)?.archivedAt)) return null;
  return path;
}

export type PublicCategoryNavNode = { id: string; label: string; slug: string; href: string; children: PublicCategoryNavNode[] };

export async function getPublicCategoryNavigation(): Promise<PublicCategoryNavNode[]> {
  const categories = await getAllCategoryRecords();
  const visibleCategories = categories.filter(({ id }) => isActiveCategoryPath(id, categories));
  const tree = buildCategoryTree(visibleCategories);
  const mapNode = (node: CategoryTreeNode, ancestors: CategoryPathItem[]): PublicCategoryNavNode => {
    const path = [...ancestors, { id: node.id, name: node.name, slug: node.slug }];
    return {
      id: node.id,
      label: node.name,
      slug: node.slug,
      href: categoryPathHref(path),
      children: node.children.map((child) => mapNode(child, path)),
    };
  };
  return tree.map((node) => mapNode(node, []));
}

export function matchCategorySlugPath(slugs: string[], categories: readonly CategoryRecord[]) {
  if (!slugs.length) return null;
  const byId = new Map(categories.map((category) => [category.id, category]));
  const roots = categories.filter(({ parentId, archivedAt }) => parentId === null && archivedAt === null);
  let current = roots.find(({ slug }) => slug === slugs[0]);
  if (!current) return null;
  const matched = [current];
  for (const slug of slugs.slice(1)) {
    current = categories.find((category) => category.parentId === current!.id && category.slug === slug && !category.archivedAt);
    if (!current) return null;
    matched.push(current);
  }
  const path = resolveCategoryPath(current.id, categories);
  if (!path || path.length !== slugs.length || path.some(({ id }) => byId.get(id)?.archivedAt)) return null;
  return { category: current, path };
}
