import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LoginAudience = "customer" | "internal";

export async function POST(request: Request) {
  let audience: LoginAudience;

  try {
    const body = (await request.json()) as { audience?: unknown };

    if (body.audience !== "customer" && body.audience !== "internal") {
      return Response.json({ allowed: false }, { status: 400 });
    }

    audience = body.audience;
  } catch {
    return Response.json({ allowed: false }, { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return Response.json({ allowed: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isActive: true,
      roles: {
        select: {
          role: {
            select: { scope: true },
          },
        },
      },
    },
  });

  const roleScopes = user?.roles.map(({ role }) => role.scope) ?? [];
  const isInternal = roleScopes.includes("ADMIN");

  const allowed =
    Boolean(user?.isActive) &&
    (audience === "customer"
      ? roleScopes.includes("CUSTOMER") && !isInternal
      : isInternal);

  return Response.json(
    { allowed },
    {
      status: allowed ? 200 : 403,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
