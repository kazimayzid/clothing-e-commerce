import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/dal";
import { destroyProductImage, ProductImageError } from "@/lib/cloudinary";
import { getAdminAccessContext, hasPermission } from "@/lib/admin-access";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const access = await getAdminAccessContext(session.user.id);
  if (!access?.isActive || access.roles.length === 0) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  if (!hasPermission(access, "products:create") && !hasPermission(access, "products:update")) {
    return NextResponse.json({ error: "Product image permission required." }, { status: 403 });
  }
  const { id } = await params;
  const image = await prisma.productImage.findFirst({
    where: { id, uploadedById: access.userId, productId: null, deletedAt: null },
    select: { id: true, publicId: true },
  });
  if (!image) return NextResponse.json({ error: "Staged image not found." }, { status: 404 });
  try {
    await destroyProductImage(image.publicId);
    await prisma.productImage.delete({ where: { id: image.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProductImageError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Staged image removal failed", error);
    return NextResponse.json({ error: "Could not remove the staged image." }, { status: 502 });
  }
}
