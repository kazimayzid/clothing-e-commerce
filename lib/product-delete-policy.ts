export type ProductDeleteBlock = "PRODUCT_NOT_ARCHIVED" | "PRODUCT_IMAGE_RELATION_MISMATCH";

export class ProductDeletionBlockedError extends Error {
  constructor(readonly block: ProductDeleteBlock) {
    super(block);
    this.name = "ProductDeletionBlockedError";
  }
}

export function getProductDeleteBlock(input: { status: string; archivedAt: Date | string | null }) {
  return input.status !== "ARCHIVED" || !input.archivedAt ? "PRODUCT_NOT_ARCHIVED" : null;
}

export function isProductDeleteForeignKeyError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2003");
}

export async function executePermanentProductDelete(
  input: { status: string; archivedAt: Date | string | null },
  actions: {
    writeAudit: () => Promise<unknown>;
    deleteImages: () => Promise<unknown>;
    deleteVariants: () => Promise<unknown>;
    deleteProduct: () => Promise<unknown>;
  },
) {
  const block = getProductDeleteBlock(input);
  if (block) throw new ProductDeletionBlockedError(block);
  await actions.writeAudit();
  await actions.deleteImages();
  await actions.deleteVariants();
  return actions.deleteProduct();
}
