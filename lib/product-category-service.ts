import "server-only";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  buildCategoryTree,
  buildPublicCategoryTree,
  categoryPathHref,
  getActiveCategoryIds,
  isActiveCategoryPath,
  resolveCategoryPath,
  type CategoryPathItem,
  type CategoryRecord,
  type CategoryTreeNode,
  type PublicCategoryTreeNode,
} from "@/lib/category-tree";

const getCachedCategoryRecords = unstable_cache(
  async () => prisma.productCategory.findMany({
    select: { id: true, name: true, slug: true, description: true, parentId: true, archivedAt: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
  }),
  ["public-product-category-records"],
  { revalidate: 300, tags: ["product-categories"] },
);

export async function getAllCategoryRecords(): Promise<CategoryRecord[]> {
  return getCachedCategoryRecords();
}

export function revalidatePublicCategoryData() {
  try {
    revalidateTag("product-categories", { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/categories/[...slugs]", "page");
  } catch (error) {
    console.error("Could not invalidate public category cache", error);
  }
}

export async function getProductCategoryPath(categoryId: string, publicOnly = false): Promise<CategoryPathItem[] | null> {
  const categories = await getAllCategoryRecords();
  const path = resolveCategoryPath(categoryId, categories);
  if (!path) return null;
  if (publicOnly && !isActiveCategoryPath(categoryId, categories)) return null;
  return path;
}

export type PublicCategoryNavNode = {
  id: string;
  label: string;
  slug: string;
  href: string;
  description: string | null;
  sortOrder: number;
  children: PublicCategoryNavNode[];
};

export async function getPublicCategoryNavigation(): Promise<PublicCategoryNavNode[]> {
  const categories = await getAllCategoryRecords();
  const activeIds = getActiveCategoryIds(categories);
  const visibleCategories = categories.filter(({ id }) => activeIds.has(id));
  const tree = buildCategoryTree(visibleCategories);
  const mapNode = (node: CategoryTreeNode, ancestors: CategoryPathItem[]): PublicCategoryNavNode => {
    const path = [...ancestors, { id: node.id, name: node.name, slug: node.slug }];
    return {
      id: node.id,
      label: node.name,
      slug: node.slug,
      href: categoryPathHref(path),
      description: node.description,
      sortOrder: node.sortOrder ?? 0,
      children: node.children.map((child) => mapNode(child, path)),
    };
  };
  return tree.map((node) => mapNode(node, []));
}

export async function getPublicCategoryTree(): Promise<PublicCategoryTreeNode[]> {
  const categories = await getAllCategoryRecords();
  return buildPublicCategoryTree(categories);
}
