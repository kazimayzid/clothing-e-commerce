export type CategoryDeleteBlock = "CATEGORY_ACTIVE" | "PRODUCTS_ASSIGNED" | "CHILD_CATEGORIES";

export class CategoryDeletionBlockedError extends Error {
  constructor(readonly block: CategoryDeleteBlock) {
    super(block);
    this.name = "CategoryDeletionBlockedError";
  }
}

export function getCategoryDeleteBlock(input: {
  archivedAt: Date | string | null;
  productCount: number;
  childCount: number;
}): CategoryDeleteBlock | null {
  if (!input.archivedAt) return "CATEGORY_ACTIVE";
  if (input.productCount > 0) return "PRODUCTS_ASSIGNED";
  if (input.childCount > 0) return "CHILD_CATEGORIES";
  return null;
}

export async function executePermanentCategoryDelete(
  input: { archivedAt: Date | string | null; productCount: number; childCount: number },
  actions: { writeAudit: () => Promise<unknown>; deleteCategory: () => Promise<unknown> },
) {
  const block = getCategoryDeleteBlock(input);
  if (block) throw new CategoryDeletionBlockedError(block);
  await actions.writeAudit();
  await actions.deleteCategory();
}
