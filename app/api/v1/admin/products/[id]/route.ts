import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { hasPermission, requireAdminApiPermission } from "@/lib/admin-access";
import { adminProductInclude, toAdminProductDTO } from "@/lib/product-data";
import { canSetVariantStock, updateProductSchema, slugifyProductName } from "@/lib/product-validation";
import { destroyProductImage } from "@/lib/cloudinary";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const authorization = await requireAdminApiPermission("products:read");
  if ("response" in authorization) return authorization.response;
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: adminProductInclude });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product: toAdminProductDTO(product) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, { params }: Context) {
  const authorization = await requireAdminApiPermission("products:update");
  if ("response" in authorization) return authorization.response;
  const { id } = await params;
  const parsed = updateProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Product changes are invalid.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const input = parsed.data;
  const mayAdjustInventory = hasPermission(authorization.context, "inventory:adjust");
  const categorySlug = input.categoryName ? slugifyProductName(input.categoryName) : null;
  if (input.categoryName && !categorySlug) return NextResponse.json({ error: "Category name must contain letters or numbers." }, { status: 400 });

  let removedImageIds: string[] = [];
  try {
    const product = await prisma.$transaction(async (tx) => {
      const before = await tx.product.findUnique({ where: { id }, include: adminProductInclude });
      if (!before) throw new Error("PRODUCT_NOT_FOUND");
      if (before.status === "ARCHIVED" && input.status !== undefined) throw new Error("ARCHIVED_PRODUCT_REQUIRES_RESTORE");
      const effectivePrice = input.price !== undefined ? new Prisma.Decimal(input.price) : before.price;
      const effectiveMultibuy = input.multibuyPrice !== undefined
        ? (input.multibuyPrice ? new Prisma.Decimal(input.multibuyPrice) : null)
        : before.multibuyPrice;
      if (effectiveMultibuy && effectiveMultibuy.greaterThanOrEqualTo(effectivePrice)) throw new Error("INVALID_MULTIBUY_PRICE");
      const data: Prisma.ProductUpdateInput = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.slug !== undefined) data.slug = input.slug;
      if (input.description !== undefined) data.description = input.description;
      if (input.detailsAndCare !== undefined) data.detailsAndCare = input.detailsAndCare;
      if (input.gender !== undefined) data.gender = input.gender;
      if (input.categoryName !== undefined && categorySlug) {
        const category = await tx.productCategory.upsert({
          where: { slug: categorySlug },
          update: { name: input.categoryName },
          create: { name: input.categoryName, slug: categorySlug },
          select: { id: true },
        });
        data.category = { connect: { id: category.id } };
      }
      if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
      if (input.multibuyPrice !== undefined) data.multibuyPrice = input.multibuyPrice ? new Prisma.Decimal(input.multibuyPrice) : null;
      if (input.currency !== undefined) data.currency = input.currency;
      if (input.status !== undefined) data.status = input.status;
      if (input.tags !== undefined) data.tags = input.tags;
      if (input.isNew !== undefined) data.isNew = input.isNew;
      if (input.bestsellerRank !== undefined) data.bestsellerRank = input.bestsellerRank;

      const existingById = new Map(before.variants.map((variant) => [variant.id, variant]));
      const resolvedVariantIds = new Map<number, string>();
      if (input.variants !== undefined) {
        const submittedIds = input.variants.flatMap((variant) => variant.id ? [variant.id] : []);
        if (new Set(submittedIds).size !== submittedIds.length) throw new Error("DUPLICATE_VARIANT_ID");
        const submittedExisting = input.variants.filter((variant) => variant.id);
        if (submittedExisting.some((variant) => !existingById.has(variant.id!))) throw new Error("VARIANT_OWNERSHIP_INVALID");
        if (input.variants.some((variant) => {
          const existing = variant.id ? existingById.get(variant.id) : undefined;
          return !canSetVariantStock(mayAdjustInventory, variant.stockQuantity, existing?.stockQuantity);
        })) throw new Error("INVENTORY_PERMISSION_REQUIRED");

        for (const [variantIndex, variant] of input.variants.entries()) {
          const old = variant.id ? existingById.get(variant.id) : undefined;
          const stockQuantity = mayAdjustInventory
            ? variant.stockQuantity ?? old?.stockQuantity ?? 0
            : old?.stockQuantity ?? 0;
          const variantData = {
            name: variant.name,
            sku: variant.sku?.trim().toUpperCase() || null,
            size: variant.size || null,
            colorName: variant.colorName || null,
            colorHex: variant.colorHex || null,
            priceOverride: variant.priceOverride ? new Prisma.Decimal(variant.priceOverride) : null,
            stockQuantity,
            isActive: variant.isActive ?? old?.isActive ?? true,
          };
          const saved = old
            ? await tx.productVariant.update({ where: { id: old.id }, data: variantData, select: { id: true } })
            : await tx.productVariant.create({ data: { ...variantData, productId: id }, select: { id: true } });
          resolvedVariantIds.set(variantIndex, saved.id);
        }
        await tx.productVariant.updateMany({
          where: { productId: id, ...(submittedIds.length ? { id: { notIn: submittedIds } } : {}) },
          data: { isActive: false },
        });
      }

      const imagesAreChanging = input.images !== undefined || input.variants?.some(({ images }) => images !== undefined);
      if (input.status === "PUBLISHED" && !imagesAreChanging && before.images.length === 0) throw new Error("PUBLISHED_PRODUCT_REQUIRES_IMAGE");
      if (imagesAreChanging) {
        type ImageAssignment = { id: string; variantId: string | null; sortOrder: number; isPrimary: boolean; altText?: string | null };
        const assignments: ImageAssignment[] = [];
        const commonImages = input.images ?? before.images.filter(({ variantId }) => variantId === null).map(({ id: imageId, altText, sortOrder, isPrimary }) => ({ id: imageId, altText, sortOrder, isPrimary }));
        const commonPrimaryId = input.primaryImageId ?? commonImages.find((image) => image.isPrimary)?.id ?? commonImages[0]?.id;
        commonImages.forEach((image, sortOrder) => assignments.push({ id: image.id, variantId: null, sortOrder, isPrimary: image.id === commonPrimaryId, altText: image.altText }));

        if (input.variants === undefined) {
          before.variants.forEach((variant) => variant.images.forEach((image) => assignments.push({ id: image.id, variantId: variant.id, sortOrder: image.sortOrder, isPrimary: image.isPrimary, altText: image.altText })));
        } else {
          const submittedVariantIds = new Set(input.variants.flatMap(({ id: variantId }) => variantId ? [variantId] : []));
          before.variants.filter(({ id: variantId }) => !submittedVariantIds.has(variantId)).forEach((variant) => variant.images.forEach((image) => assignments.push({ id: image.id, variantId: variant.id, sortOrder: image.sortOrder, isPrimary: image.isPrimary, altText: image.altText })));
          input.variants.forEach((variant, variantIndex) => {
            const old = variant.id ? existingById.get(variant.id) : undefined;
            const variantImages = variant.images ?? old?.images.map(({ id: imageId, altText, sortOrder, isPrimary }) => ({ id: imageId, altText, sortOrder, isPrimary })) ?? [];
            const primaryId = variant.primaryImageId ?? variantImages.find((image) => image.isPrimary)?.id ?? variantImages[0]?.id;
            variantImages.forEach((image, sortOrder) => assignments.push({
              id: image.id,
              variantId: resolvedVariantIds.get(variantIndex)!,
              sortOrder,
              isPrimary: image.id === primaryId,
              altText: image.altText,
            }));
          });
        }
        const submittedImageIds = assignments.map(({ id: imageId }) => imageId);
        if (new Set(submittedImageIds).size !== submittedImageIds.length) throw new Error("DUPLICATE_IMAGE_ID");
        const currentIds = new Set(before.images.map(({ id: imageId }) => imageId));
        const existingSubmitted = submittedImageIds.filter((imageId) => currentIds.has(imageId));
        const stagedSubmitted = submittedImageIds.filter((imageId) => !currentIds.has(imageId));
        const stagedImages = stagedSubmitted.length ? await tx.productImage.findMany({
          where: { id: { in: stagedSubmitted }, productId: null, uploadedById: authorization.context.userId, deletedAt: null },
          select: { id: true },
        }) : [];
        if (stagedImages.length !== stagedSubmitted.length || existingSubmitted.length + stagedImages.length !== submittedImageIds.length) {
          throw new Error("IMAGE_OWNERSHIP_INVALID");
        }
        const effectiveStatus = input.status ?? before.status;
        if (effectiveStatus === "PUBLISHED" && submittedImageIds.length === 0) throw new Error("PUBLISHED_PRODUCT_REQUIRES_IMAGE");
        const removed = before.images.filter(({ id: imageId }) => !submittedImageIds.includes(imageId));
        removedImageIds = removed.map(({ id: imageId }) => imageId);
        if (removedImageIds.length) await tx.productImage.updateMany({ where: { id: { in: removedImageIds } }, data: { deletedAt: new Date(), isPrimary: false } });
        for (const image of assignments) {
          await tx.productImage.update({ where: { id: image.id }, data: {
            productId: id,
            variantId: image.variantId,
            altText: image.altText || (image.variantId ? before.variants.find(({ id: variantId }) => variantId === image.variantId)?.colorName : null) || input.title || before.title,
            sortOrder: image.sortOrder,
            isPrimary: image.isPrimary,
          } });
        }
      }

      const updated = await tx.product.update({ where: { id }, data, include: adminProductInclude });
      const beforeAudit = auditState(before);
      const afterAudit = auditState(updated);
      const changedFields = Object.keys(afterAudit).filter((field) => JSON.stringify(beforeAudit[field as keyof typeof beforeAudit]) !== JSON.stringify(afterAudit[field as keyof typeof afterAudit]));
      await appendAdminAuditLog(tx, {
        actor: authorization.context,
        action: "products.updated",
        category: "PRODUCT",
        riskLevel: "MEDIUM",
        description: `Updated product ${updated.title}.`,
        targetType: "PRODUCT",
        targetId: updated.id,
        targetName: updated.title,
        beforeState: beforeAudit,
        afterState: afterAudit,
        changedFields,
        request,
      });
      return updated;
    });
    for (const imageId of removedImageIds) {
      const removed = await prisma.productImage.findUnique({ where: { id: imageId }, select: { publicId: true } });
      if (!removed) continue;
      try {
        await destroyProductImage(removed.publicId);
        await prisma.productImage.delete({ where: { id: imageId } });
      } catch (error) {
        console.error("Product image cleanup failed", { imageId, error });
      }
    }
    return NextResponse.json({ product: toAdminProductDTO(product) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (error instanceof Error && error.message === "ARCHIVED_PRODUCT_REQUIRES_RESTORE") return NextResponse.json({ error: "Restore this product with products:archive permission before changing its status." }, { status: 409 });
    if (error instanceof Error && error.message === "INVENTORY_PERMISSION_REQUIRED") return NextResponse.json({ error: "Stock changes require inventory:adjust permission." }, { status: 403 });
    if (error instanceof Error && error.message === "IMAGE_OWNERSHIP_INVALID") return NextResponse.json({ error: "One or more uploaded images are invalid or do not belong to this product." }, { status: 400 });
    if (error instanceof Error && error.message === "PUBLISHED_PRODUCT_REQUIRES_IMAGE") return NextResponse.json({ error: "Published products require at least one image." }, { status: 400 });
    if (error instanceof Error && error.message === "INVALID_MULTIBUY_PRICE") return NextResponse.json({ error: "Multibuy price must be lower than the regular price." }, { status: 400 });
    if (error instanceof Error && error.message.startsWith("DUPLICATE_")) return NextResponse.json({ error: "Remove duplicate variants or images before saving." }, { status: 400 });
    if (error instanceof Error && error.message === "VARIANT_OWNERSHIP_INVALID") return NextResponse.json({ error: "A selected variant does not belong to this product." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "A product with this slug or SKU already exists." }, { status: 409 });
    console.error("Product update failed", error);
    return NextResponse.json({ error: "Could not update the product." }, { status: 500 });
  }
}

function auditState(product: {
  title: string; slug: string; description: string; detailsAndCare: string[]; gender: string; price: Prisma.Decimal;
  multibuyPrice: Prisma.Decimal | null; currency: string; status: string; tags: string[];
  isNew: boolean; bestsellerRank: number | null; category: { name: string };
  images: { id: string; secureUrl: string; isPrimary: boolean; sortOrder: number }[];
  variants: { id: string; sku: string | null; size: string | null; colorName: string | null; priceOverride: Prisma.Decimal | null; stockQuantity: number; isActive: boolean; images: { id: string; variantId: string | null; sortOrder: number; isPrimary: boolean }[] }[];
}) {
  return {
    title: product.title, slug: product.slug, description: product.description, detailsAndCare: product.detailsAndCare, gender: product.gender,
    price: product.price.toFixed(2), multibuyPrice: product.multibuyPrice?.toFixed(2) ?? null,
    currency: product.currency.trim(), status: product.status, tags: product.tags, isNew: product.isNew,
    bestsellerRank: product.bestsellerRank, category: product.category.name,
    images: product.images.map(({ id, secureUrl, isPrimary, sortOrder }) => ({ id, secureUrl, isPrimary, sortOrder })),
    variants: product.variants.map(({ id, sku, size, colorName, priceOverride, stockQuantity, isActive, images }) => ({ id, sku, size, colorName, priceOverride: priceOverride?.toFixed(2) ?? null, stockQuantity, isActive, images: images.map(({ id: imageId, variantId, sortOrder, isPrimary }) => ({ id: imageId, variantId, sortOrder, isPrimary })) })),
  };
}
