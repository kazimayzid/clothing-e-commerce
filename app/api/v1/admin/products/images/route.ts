import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/dal";
import { getAdminAccessContext, hasPermission } from "@/lib/admin-access";
import { destroyProductImage, ProductImageError, uploadProductImage } from "@/lib/cloudinary";

async function authorizeImageWrite() {
  const session = await getCurrentSession();
  if (!session) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  const access = await getAdminAccessContext(session.user.id);
  if (!access?.isActive || access.roles.length === 0) {
    return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) } as const;
  }
  if (!hasPermission(access, "products:create") && !hasPermission(access, "products:update")) {
    return { response: NextResponse.json({ error: "Product image permission required." }, { status: 403 }) } as const;
  }
  return { access } as const;
}

export async function POST(request: Request) {
  const authorization = await authorizeImageWrite();
  if ("response" in authorization) return authorization.response;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
  let uploaded: Awaited<ReturnType<typeof uploadProductImage>> | undefined;
  try {
    uploaded = await uploadProductImage(file, authorization.access.userId);
    const image = await prisma.productImage.create({
      data: {
        uploadedById: authorization.access.userId,
        publicId: uploaded.publicId,
        secureUrl: uploaded.secureUrl,
        format: uploaded.format,
      },
      select: { id: true, secureUrl: true, format: true },
    });
    return NextResponse.json({ image }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (uploaded) {
      try { await destroyProductImage(uploaded.publicId); }
      catch (cleanupError) { console.error("Staged image cleanup failed", cleanupError); }
    }
    if (error instanceof ProductImageError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Product image upload failed", error);
    return NextResponse.json({ error: "Could not upload the product image." }, { status: 502 });
  }
}
