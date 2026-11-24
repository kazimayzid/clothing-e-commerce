import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashInvitationToken, normalizeEmail } from "@/lib/admin-invitations";
import { appendAdminAuditLog } from "@/lib/admin-audit";
import { getAdminAccessContext } from "@/lib/admin-access";

const acceptSchema = z.object({ token: z.string().min(32).max(100) });

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json(
      { error: "Sign in with the invited email address first." },
      { status: 401 },
    );
  const parsed = acceptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invitation is invalid or no longer available." },
      { status: 400 },
    );

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.adminInvitation.findUnique({
        where: { tokenHash: hashInvitationToken(parsed.data.token) },
        include: {
          roles: {
            include: {
              role: { select: { id: true, name: true, slug: true, scope: true, isSuperAdmin: true } },
            },
          },
        },
      });
      if (!invitation)
        return {
          error: "Invitation is invalid or no longer available.",
          status: 404,
        };
      const now = new Date();
      if (invitation.status !== "PENDING")
        return {
          error: "Invitation is invalid or no longer available.",
          status: 409,
        };
      if (invitation.expiresAt <= now) {
        await tx.adminInvitation.updateMany({
          where: {
            id: invitation.id,
            status: "PENDING",
            expiresAt: { lte: now },
          },
          data: { status: "EXPIRED" },
        });
        return { error: "This invitation has expired.", status: 410 };
      }

      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, emailVerified: true, isActive: true },
      });
      if (
        !user ||
        !user.isActive ||
        normalizeEmail(user.email) !== invitation.email
      ) {
        return {
          error: "Sign in with the invited email address first.",
          status: 403,
        };
      }
      if (!user.emailVerified && invitation.inviteeExistedAtInvite)
        return {
          error:
            "Sign in to the existing account and verify this email address through Better Auth before accepting the invitation.",
          status: 403,
        };
      if (
        invitation.roles.length === 0 ||
        invitation.roles.some(
          ({ role }) => role.scope !== "ADMIN" || role.isSuperAdmin,
        )
      ) {
        return {
          error: "The invitation contains an invalid role assignment.",
          status: 409,
        };
      }

      const claimed = await tx.adminInvitation.updateMany({
        where: { id: invitation.id, status: "PENDING", expiresAt: { gt: now } },
        data: { status: "ACCEPTED", acceptedAt: now, acceptedUserId: user.id },
      });
      if (claimed.count !== 1)
        return {
          error: "Invitation has already been accepted or changed.",
          status: 409,
        };
      if (!user.emailVerified) {
        await tx.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      }
      await tx.userRole.createMany({
        data: invitation.roles.map(({ roleId }) => ({
          userId: user.id,
          roleId,
        })),
        skipDuplicates: true,
      });
      await appendAdminAuditLog(tx, {
        actor: {
          userId: user.id, name: user.name, email: user.email, isSuperAdmin: false,
          roles: invitation.roles.map(({ role }) => ({ id: role.id, name: role.name, slug: role.slug, isSuperAdmin: false })),
        },
        request, action: "invitation.accepted", category: "INVITATION", riskLevel: "HIGH",
        description: `Staff invitation accepted by ${user.email}.`, targetType: "INVITATION", targetId: invitation.id, targetName: invitation.name, targetEmail: invitation.email,
        beforeState: { status: "PENDING", userHadAdminAccess: false },
        afterState: { status: "ACCEPTED", userId: user.id, roleIds: invitation.roles.map(({ roleId }) => roleId) },
      });
      return { ok: true as const };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Invitation has already been accepted or changed." },
        { status: 409 },
      );
    }
    throw error;
  }

  if ("error" in result) {
    const actor = await getAdminAccessContext(session.user.id);
    if (actor) {
      try {
        await appendAdminAuditLog(prisma, {
          actor, request, action: "invitation.acceptance_denied", category: "INVITATION", riskLevel: "HIGH",
          description: "A signed-in user submitted an invitation acceptance that did not pass validation.", targetType: "INVITATION",
          success: false, failureCode: `HTTP_${result.status}`,
        });
      } catch (auditError) {
        console.error("Failed to record rejected invitation acceptance", auditError);
      }
    }
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
  return NextResponse.json({ accepted: true, redirectTo: "/admin/dashboard" });
}
