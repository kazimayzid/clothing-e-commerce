export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  archivedAt: Date | string | null;
};

export type CategoryPathItem = Pick<CategoryRecord, "id" | "name" | "slug">;

export type CategoryTreeNode = CategoryRecord & {
  children: CategoryTreeNode[];
};

export function resolveCategoryPath(categoryId: string, categories: readonly CategoryRecord[]): CategoryPathItem[] | null {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const path: CategoryRecord[] = [];
  const visited = new Set<string>();
  let current = byId.get(categoryId);
  while (current) {
    if (visited.has(current.id)) return null;
    visited.add(current.id);
    path.push(current);
    if (!current.parentId) break;
    current = byId.get(current.parentId);
    if (!current) return null;
  }
  if (!path.length || path.at(-1)?.parentId) return null;
  return path.reverse().map(({ id, name, slug }) => ({ id, name, slug }));
}

export function isActiveCategoryPath(categoryId: string, categories: readonly CategoryRecord[]) {
  const path = resolveCategoryPath(categoryId, categories);
  if (!path) return false;
  const byId = new Map(categories.map((category) => [category.id, category]));
  return path.every(({ id }) => !byId.get(id)?.archivedAt);
}

export function getDescendantCategoryIds(categoryId: string, categories: readonly CategoryRecord[]) {
  const children = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const siblings = children.get(category.parentId) ?? [];
    siblings.push(category.id);
    children.set(category.parentId, siblings);
  }
  const result: string[] = [];
  const visited = new Set<string>([categoryId]);
  const pending = [categoryId];
  while (pending.length) {
    const current = pending.pop()!;
    result.push(current);
    for (const childId of children.get(current) ?? []) {
      if (visited.has(childId)) continue;
      visited.add(childId);
      pending.push(childId);
    }
  }
  return result;
}

export function wouldCreateCategoryCycle(categoryId: string, parentId: string | null, categories: readonly CategoryRecord[]) {
  if (parentId === null) return false;
  if (categoryId === parentId) return true;
  const byId = new Map(categories.map((category) => [category.id, category]));
  const visited = new Set<string>();
  let currentId: string | null = parentId;
  while (currentId) {
    if (currentId === categoryId || visited.has(currentId)) return true;
    visited.add(currentId);
    currentId = byId.get(currentId)?.parentId ?? null;
  }
  return false;
}

export function buildCategoryTree(categories: readonly CategoryRecord[], includeArchived = false): CategoryTreeNode[] {
  const rows = categories.filter((category) => includeArchived || !category.archivedAt);
  const byId = new Map<string, CategoryTreeNode>();
  for (const category of rows) byId.set(category.id, { ...category, children: [] });
  const roots: CategoryTreeNode[] = [];
  for (const category of rows) {
    const node = byId.get(category.id)!;
    const parent = category.parentId ? byId.get(category.parentId) : undefined;
    if (parent) parent.children.push(node);
    else if (!category.parentId) roots.push(node);
  }
  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(({ children }) => sortNodes(children));
  };
  sortNodes(roots);
  return roots;
}

export function categoryPathHref(path: readonly Pick<CategoryPathItem, "slug">[]) {
  return `/categories/${path.map(({ slug }) => encodeURIComponent(slug)).join("/")}`;
}
