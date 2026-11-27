import { z } from "zod";

const moneySchema = z.string().trim().regex(/^\d{1,8}(?:\.\d{1,2})?$/, "Enter a valid amount with up to two decimal places.");
const slugSchema = z.string().trim().min(2).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens for the slug.");
const categorySlugSchema = z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens for the category slug.");

export const createProductCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: categorySlugSchema,
  description: z.string().trim().max(5000).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(-100_000).max(100_000).optional(),
});

export const updateProductCategorySchema = createProductCategorySchema.partial();

export const productImageInputSchema = z.object({
  id: z.string().uuid(),
  altText: z.string().trim().max(250).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().max(100).optional().nullable(),
  size: z.string().trim().max(40).optional().nullable(),
  colorName: z.string().trim().max(80).optional().nullable(),
  colorHex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  priceOverride: moneySchema.optional().nullable(),
  stockQuantity: z.number().int().min(0).max(1_000_000).optional(),
  isActive: z.boolean().optional(),
  images: z.array(productImageInputSchema).max(12).optional(),
  primaryImageId: z.string().uuid().nullable().optional(),
});

const productFields = {
  title: z.string().trim().min(2).max(200),
  slug: slugSchema,
  description: z.string().trim().min(1).max(20_000),
  detailsAndCare: z.array(z.string().trim().min(1).max(300)).max(30),
  gender: z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]),
  categoryId: z.string().uuid(),
  price: moneySchema,
  multibuyPrice: moneySchema.nullable(),
  currency: z.enum(["GBP", "USD", "EUR", "BDT"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  tags: z.array(z.string().trim().min(1).max(50)).max(30),
  isNew: z.boolean(),
  bestsellerRank: z.number().int().min(1).max(100_000).nullable(),
  variants: z.array(productVariantSchema).max(100),
  images: z.array(productImageInputSchema).max(12),
  primaryImageId: z.string().uuid().nullable(),
};

function amountInMinorUnits(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

const productObjectSchema = z.object(productFields);

export const createProductSchema = productObjectSchema.superRefine((value, context) => {
  if (value.multibuyPrice && amountInMinorUnits(value.multibuyPrice) >= amountInMinorUnits(value.price)) {
    context.addIssue({ code: "custom", path: ["multibuyPrice"], message: "Multibuy price must be lower than the regular price." });
  }
  if (value.status === "PUBLISHED" && value.images.length === 0 && value.variants.every(({ images }) => !images?.length)) {
    context.addIssue({ code: "custom", path: ["images"], message: "Add at least one product image before publishing." });
  }
  if (value.primaryImageId && !value.images.some(({ id }) => id === value.primaryImageId)) {
    context.addIssue({ code: "custom", path: ["primaryImageId"], message: "Primary image must be included in the product images." });
  }
  const imageIds = [
    ...value.images.map(({ id }) => id),
    ...value.variants.flatMap(({ images }) => images?.map(({ id }) => id) ?? []),
  ];
  if (new Set(imageIds).size !== imageIds.length) {
    context.addIssue({ code: "custom", path: ["variants"], message: "Each uploaded image can belong to only one gallery." });
  }
  value.variants.forEach((variant, index) => {
    if (variant.primaryImageId && !variant.images?.some(({ id }) => id === variant.primaryImageId)) {
      context.addIssue({ code: "custom", path: ["variants", index, "primaryImageId"], message: "Variant primary image must be included in that variant's images." });
    }
  });
});

export const updateProductSchema = productObjectSchema.partial().superRefine((value, context) => {
  if (value.price && value.multibuyPrice && amountInMinorUnits(value.multibuyPrice) >= amountInMinorUnits(value.price)) {
    context.addIssue({ code: "custom", path: ["multibuyPrice"], message: "Multibuy price must be lower than the regular price." });
  }
  if (value.primaryImageId && value.images && !value.images.some(({ id }) => id === value.primaryImageId)) {
    context.addIssue({ code: "custom", path: ["primaryImageId"], message: "Primary image must be included in the product images." });
  }
  if (value.primaryImageId !== undefined && value.images === undefined) {
    context.addIssue({ code: "custom", path: ["images"], message: "Send the product image list when changing its primary image." });
  }
  if (value.variants && value.images) {
    const imageIds = [
      ...value.images.map(({ id }) => id),
      ...value.variants.flatMap(({ images }) => images?.map(({ id }) => id) ?? []),
    ];
    if (new Set(imageIds).size !== imageIds.length) {
      context.addIssue({ code: "custom", path: ["variants"], message: "Each uploaded image can belong to only one gallery." });
    }
  }
  value.variants?.forEach((variant, index) => {
    if (variant.primaryImageId && (!variant.images || !variant.images.some(({ id }) => id === variant.primaryImageId))) {
      context.addIssue({ code: "custom", path: ["variants", index, "primaryImageId"], message: "Variant primary image must be included in that variant's images." });
    }
  });
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;

export function slugifyProductName(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 220).replace(/-+$/g, "");
}

export function hasAvailableStock(variants: readonly { isActive: boolean; stockQuantity: number }[]) {
  return variants.some((variant) => variant.isActive && variant.stockQuantity > 0);
}

export function canAddVariantQuantity(isActive: boolean, stockQuantity: number, requestedQuantity: number) {
  return isActive && Number.isInteger(requestedQuantity) && requestedQuantity > 0 && requestedQuantity <= stockQuantity;
}

export function canSetVariantStock(
  canAdjustInventory: boolean,
  submittedQuantity: number | undefined,
  currentQuantity?: number,
) {
  if (canAdjustInventory || submittedQuantity === undefined) return true;
  return currentQuantity === undefined ? submittedQuantity === 0 : submittedQuantity === currentQuantity;
}
