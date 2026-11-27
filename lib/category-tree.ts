export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  archivedAt: Date | string | null;
  sortOrder?: number;
};

export type CategoryPathItem = Pick<CategoryRecord, "id" | "name" | "slug">;

export type CategoryTreeNode = CategoryRecord & {
  children: CategoryTreeNode[];
};

export type PublicCategoryTreeNode = Pick<CategoryRecord, "id" | "name" | "slug" | "description" | "sortOrder"> & {
  children: PublicCategoryTreeNode[];
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
  return getActiveCategoryIds(categories).has(categoryId);
}

export function getActiveCategoryIds(categories: readonly CategoryRecord[]) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const activeById = new Map<string, boolean>();
  for (const category of categories) {
    if (activeById.has(category.id)) continue;
    const path: string[] = [];
    const visited = new Set<string>();
    let currentId: string | null = category.id;
    let active = false;
    while (currentId) {
      const cached = activeById.get(currentId);
      if (cached !== undefined) { active = cached; break; }
      if (visited.has(currentId)) { active = false; break; }
      visited.add(currentId);
      const current = byId.get(currentId);
      if (!current || current.archivedAt) { active = false; break; }
      path.push(currentId);
      if (!current.parentId) { active = true; break; }
      currentId = current.parentId;
    }
    for (let index = path.length - 1; index >= 0; index -= 1) activeById.set(path[index]!, active);
  }
  return new Set([...activeById].filter(([, active]) => active).map(([id]) => id));
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

/** Resolves both the hierarchical category identifiers and the legacy name search. */
export function resolveProductCategoryIds(value: string, categories: readonly CategoryRecord[], activeIds: ReadonlySet<string>) {
  const normalized = value.trim();
  const direct = categories.find(({ id, slug }) => (id === normalized || slug === normalized) && activeIds.has(id))
    ?? matchCategorySlugPath(normalized.split("/").filter(Boolean), categories)?.category;
  const roots = direct
    ? [direct.id]
    : categories.filter(({ name, id }) => activeIds.has(id) && name.toLocaleLowerCase().includes(normalized.toLocaleLowerCase())).map(({ id }) => id);
  return [...new Set(roots.flatMap((id) => getDescendantCategoryIds(id, categories).filter((childId) => activeIds.has(childId))))];
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
    nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
    nodes.forEach(({ children }) => sortNodes(children));
  };
  sortNodes(roots);
  return roots;
}

export function buildPublicCategoryTree(categories: readonly CategoryRecord[]): PublicCategoryTreeNode[] {
  const activeIds = getActiveCategoryIds(categories);
  const active = categories.filter(({ id }) => activeIds.has(id));
  const mapNode = (node: CategoryTreeNode): PublicCategoryTreeNode => ({
    id: node.id,
    name: node.name,
    slug: node.slug,
    description: node.description,
    sortOrder: node.sortOrder ?? 0,
    children: node.children.map(mapNode),
  });
  return buildCategoryTree(active).map(mapNode);
}

export function categoryPathHref(path: readonly Pick<CategoryPathItem, "slug">[]) {
  return `/categories/${path.map(({ slug }) => encodeURIComponent(slug)).join("/")}`;
}

export function matchCategorySlugPath(slugs: string[], categories: readonly CategoryRecord[]) {
  if (!slugs.length) return null;
  const byId = new Map(categories.map((category) => [category.id, category]));
  const byParentAndSlug = new Map(categories.map((category) => [`${category.parentId ?? "root"}:${category.slug}`, category]));
  let current = byParentAndSlug.get(`root:${slugs[0]}`);
  if (current?.archivedAt) return null;
  if (!current) return null;
  for (const slug of slugs.slice(1)) {
    current = byParentAndSlug.get(`${current.id}:${slug}`);
    if (current?.archivedAt) return null;
    if (!current) return null;
  }
  const path = resolveCategoryPath(current.id, categories);
  if (!path || path.length !== slugs.length || path.some(({ id }) => byId.get(id)?.archivedAt)) return null;
  return { category: current, path };
}
