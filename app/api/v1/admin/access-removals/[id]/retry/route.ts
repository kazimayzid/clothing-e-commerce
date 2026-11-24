import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { sendAccessRemovalNotification, serializeAccessRemoval } from "@/lib/admin-access-removals";
import { prisma } from "@/lib/prisma";
import { appendAdminAuditLog } from "@/lib/admin-audit";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: RouteContext<"/api/v1/admin/access-removals/[id]/retry">) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Notification not found." }, { status: 404 });

  const exists = await prisma.adminAccessRemoval.findUnique({ where: { id }, select: { id: true, recipientName: true, recipientEmail: true, emailStatus: true } });
  if (!exists) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  const claimed = await sendAccessRemovalNotification(id);
  const removal = await prisma.adminAccessRemoval.findUniqueOrThrow({ where: { id } });
  if (!claimed) return NextResponse.json({ error: "This notification is not eligible for retry, or another send is already in progress." }, { status: 409 });
  await appendAdminAuditLog(prisma, {
    actor: access.context, request, action: "admin_access_removal.notification_retried", category: "USER_ACCESS", riskLevel: "MEDIUM",
    description: `Retried the admin access removal email for ${exists.recipientName}.`, targetType: "USER", targetId: removal.userId, targetName: exists.recipientName, targetEmail: exists.recipientEmail,
    beforeState: { emailStatus: exists.emailStatus }, afterState: { emailStatus: removal.emailStatus },
  });
  return NextResponse.json({
    removal: serializeAccessRemoval(removal),
    emailAcceptedByProvider: removal.emailStatus === "ACCEPTED_BY_PROVIDER",
  });
}
