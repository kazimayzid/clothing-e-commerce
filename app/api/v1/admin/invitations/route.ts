import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin-access";
import { EmailDeliveryError } from "@/lib/email";
import {
  createInvitationToken,
  hashInvitationToken,
  INVITATION_LIFETIME_MS,
  normalizeEmail,
  sendInvitation,
  serializeManagedInvitation,
} from "@/lib/admin-invitations";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.email().max(320),
  roleIds: z
    .array(z.string().uuid())
    .min(1)
    .max(10)
    .refine((ids) => new Set(ids).size === ids.length),
});

export async function GET() {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;

  const now = new Date();
  await prisma.adminInvitation.updateMany({
    where: { status: "PENDING", expiresAt: { lte: now } },
    data: { status: "EXPIRED" },
  });
  const invitations = await prisma.adminInvitation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      roles: {
        include: { role: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
  return NextResponse.json({
    invitations: invitations.map(serializeManagedInvitation),
  });
}

export async function POST(request: Request) {
  const access = await requireSuperAdminApi();
  if (access.response) return access.response;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a valid name, email, and one or more roles." },
      { status: 400 },
    );

  const email = normalizeEmail(parsed.data.email);
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      id: true,
      roles: {
        where: { role: { scope: "ADMIN" } },
        select: { role: { select: { id: true } } },
      },
    },
  });
  if (existingUser?.roles.length)
    return NextResponse.json(
      { error: "This email already belongs to an Admin or Staff account." },
      { status: 409 },
    );

  const roleIds = parsed.data.roleIds;
  const roles = await prisma.role.findMany({
    where: { id: { in: roleIds }, scope: "ADMIN", isSuperAdmin: false },
    select: { id: true },
  });
  if (roles.length !== roleIds.length)
    return NextResponse.json(
      { error: "One or more selected roles are unavailable for invitation." },
      { status: 400 },
    );

  const now = new Date();
  await prisma.adminInvitation.updateMany({
    where: { email, status: "PENDING", expiresAt: { lte: now } },
    data: { status: "EXPIRED" },
  });
  const token = createInvitationToken();
  let invitation;
  try {
    invitation = await prisma.adminInvitation.create({
      data: {
        email,
        name: parsed.data.name,
        tokenHash: hashInvitationToken(token),
        expiresAt: new Date(now.getTime() + INVITATION_LIFETIME_MS),
        invitedById: access.context.userId,
        inviteeExistedAtInvite: Boolean(existingUser),
        roles: {
          create: roles.map(({ id }) => ({ role: { connect: { id } } })),
        },
      },
      include: {
        roles: {
          include: { role: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email." },
        { status: 409 },
      );
    }
    throw error;
  }

  try {
    await sendInvitation(invitation.id, token);
    const savedInvitation = await prisma.adminInvitation.findUniqueOrThrow({
      where: { id: invitation.id },
      include: { roles: { include: { role: { select: { id: true, name: true, slug: true } } } } },
    });
    return NextResponse.json(
      {
        invitation: serializeManagedInvitation(savedInvitation),
        emailAcceptedByProvider: true,
        deliveryStatus: "UNCONFIRMED",
      },
      { status: 201 },
    );
  } catch (error) {
    const safeMessage = error instanceof EmailDeliveryError
      ? error.message
      : "Email state could not be confirmed. Check the invitation status before retrying.";
    console.error("Admin invitation email request failed", {
      providerStatus: error instanceof EmailDeliveryError ? error.providerStatus : undefined,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    const currentInvitation = await prisma.adminInvitation.findUniqueOrThrow({
      where: { id: invitation.id },
      include: { roles: { include: { role: { select: { id: true, name: true, slug: true } } } } },
    });
    return NextResponse.json(
      {
        invitation: serializeManagedInvitation(currentInvitation),
        emailAcceptedByProvider: error instanceof EmailDeliveryError
          ? error.acceptedByProvider
          : currentInvitation.emailStatus === "ACCEPTED_BY_PROVIDER",
        providerEmailId: error instanceof EmailDeliveryError
          ? error.providerEmailId ?? currentInvitation.providerEmailId
          : currentInvitation.providerEmailId,
        deliveryStatus: "UNCONFIRMED",
        error: safeMessage,
      },
      { status: 502 },
    );
  }
}
