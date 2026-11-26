import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAddVariantQuantity } from "@/lib/product-validation";
import { getVariantUnitPrice } from "@/lib/product-selection";

const cartValidationSchema = z.object({
  productId: z.string().min(1).max(30),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(100),
});

export async function POST(request: Request) {
  const parsed = cartValidationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Product option or quantity is invalid." }, { status: 400 });
  const { productId, variantId, quantity } = parsed.data;
  const variant = await prisma.productVariant.findFirst({
    where: {
      ...(variantId ? { id: variantId } : { stockQuantity: { gte: quantity } }),
      productId,
      isActive: true,
      product: { status: "PUBLISHED" },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      sku: true,
      size: true,
      colorName: true,
      stockQuantity: true,
      priceOverride: true,
      product: { select: { id: true, title: true, price: true, currency: true } },
    },
  });
  if (!variant) return NextResponse.json({ error: "This product option is unavailable." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!canAddVariantQuantity(true, variant.stockQuantity, quantity)) {
    return NextResponse.json({ error: `Only ${variant.stockQuantity} item${variant.stockQuantity === 1 ? "" : "s"} available for this option.` }, { status: 409, headers: { "Cache-Control": "no-store" } });
  }
  const selectedOptions = {
    ...(variant.colorName ? { color: variant.colorName } : {}),
    ...(variant.size ? { size: variant.size } : {}),
  };
  const optionLabel = [variant.colorName, variant.size].filter(Boolean).join(" / ") || variant.id;
  return NextResponse.json({
    item: {
      productId: variant.product.id,
      productTitle: variant.product.title,
      variantId: variant.id,
      sku: variant.sku,
      selectedOptions,
      variant: optionLabel,
      price: getVariantUnitPrice(variant.product.price.toFixed(2), variant.priceOverride?.toFixed(2) ?? null),
      currency: variant.product.currency.trim(),
      stockQuantity: variant.stockQuantity,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
