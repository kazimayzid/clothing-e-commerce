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
      const before = await tx.product.findUnique({ where: { id }, select: { id: true, title: true, slug: true, status: true, price: true, currency: true } });
      if (!before) throw new Error("PRODUCT_NOT_FOUND");
      if (before.status === "ARCHIVED") throw new Error("PRODUCT_ALREADY_ARCHIVED");
      const updated = await tx.product.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date() }, select: { id: true, title: true, slug: true, status: true, price: true, currency: true } });
      await appendAdminAuditLog(tx, {
        actor: authorization.context,
        action: "products.archived",
        category: "PRODUCT",
        riskLevel: "MEDIUM",
        description: `Archived product ${before.title}.`,
        targetType: "PRODUCT",
        targetId: id,
        targetName: before.title,
        beforeState: { ...before, price: before.price.toFixed(2), currency: before.currency.trim() },
        afterState: { ...updated, price: updated.price.toFixed(2), currency: updated.currency.trim() },
        changedFields: ["status", "archivedAt"],
        request,
      });
      return updated;
    });
    return NextResponse.json({ product: { ...product, price: product.price.toFixed(2) } });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (error instanceof Error && error.message === "PRODUCT_ALREADY_ARCHIVED") return NextResponse.json({ error: "Product is already archived." }, { status: 409 });
    console.error("Product archive failed", error);
    return NextResponse.json({ error: "Could not archive the product." }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ error: "Products cannot be permanently deleted." }, { status: 405, headers: { Allow: "POST" } });
}
