import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiPermission } from "@/lib/admin-access";
import { appendAdminAuditLog } from "@/lib/admin-audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireAdminApiPermission("products:archive");
  if ("response" in authorization) return authorization.response;
  const { id } = await params;
  try {
    const product = await prisma.$transaction(async (tx) => {
      const before = await tx.product.findUnique({ where: { id }, select: { id: true, title: true, slug: true, status: true, price: true, currency: true, archivedAt: true, images: { where: { deletedAt: null }, select: { id: true } } } });
      if (!before) throw new Error("PRODUCT_NOT_FOUND");
      if (before.status !== "ARCHIVED") throw new Error("PRODUCT_NOT_ARCHIVED");
      const archiveLog = await tx.adminAuditLog.findFirst({
        where: { targetType: "PRODUCT", targetId: id, action: "products.archived", success: true },
        orderBy: { createdAt: "desc" },
        select: { beforeState: true },
      });
      const previousStatus = archiveLog?.beforeState && typeof archiveLog.beforeState === "object" && !Array.isArray(archiveLog.beforeState) && "status" in archiveLog.beforeState && archiveLog.beforeState.status === "PUBLISHED"
        ? "PUBLISHED"
        : "DRAFT";
      if (previousStatus === "PUBLISHED" && before.images.length === 0) throw new Error("PUBLISHED_PRODUCT_REQUIRES_IMAGE");
      const updated = await tx.product.update({ where: { id }, data: { status: previousStatus, archivedAt: null }, select: { id: true, title: true, slug: true, status: true, price: true, currency: true } });
      await appendAdminAuditLog(tx, {
        actor: authorization.context,
        action: "products.restored",
        category: "PRODUCT",
        riskLevel: "MEDIUM",
        description: `Restored product ${before.title}.`,
        targetType: "PRODUCT",
        targetId: id,
        targetName: before.title,
        beforeState: { title: before.title, slug: before.slug, status: before.status, price: before.price.toFixed(2), currency: before.currency.trim(), archivedAt: before.archivedAt?.toISOString() ?? null },
        afterState: { ...updated, price: updated.price.toFixed(2), currency: updated.currency.trim() },
        changedFields: ["status", "archivedAt"],
        request,
      });
      return updated;
    });
    return NextResponse.json({ product: { ...product, price: product.price.toFixed(2) } });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (error instanceof Error && error.message === "PRODUCT_NOT_ARCHIVED") return NextResponse.json({ error: "Product is not archived." }, { status: 409 });
    if (error instanceof Error && error.message === "PUBLISHED_PRODUCT_REQUIRES_IMAGE") return NextResponse.json({ error: "Add an image before restoring this product to the storefront." }, { status: 409 });
    console.error("Product restore failed", error);
    return NextResponse.json({ error: "Could not restore the product." }, { status: 500 });
  }
}
