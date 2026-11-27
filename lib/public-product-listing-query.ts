import { z } from "zod";

export const publicCategoryProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
  search: z.string().trim().max(100).optional(),
  gender: z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]).optional(),
  minPrice: z.string().regex(/^\d{1,8}(?:\.\d{1,2})?$/).optional(),
  maxPrice: z.string().regex(/^\d{1,8}(?:\.\d{1,2})?$/).optional(),
  sort: z.enum(["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc"]).default("newest"),
});
