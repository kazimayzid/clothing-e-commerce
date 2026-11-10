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
            select: { slug: true },
          },
        },
      },
    },
  });

  const roleSlugs = user?.roles.map(({ role }) => role.slug) ?? [];
  const isInternal = roleSlugs.includes("admin") || roleSlugs.includes("staff");

  const allowed =
    Boolean(user?.isActive) &&
    (audience === "customer"
      ? roleSlugs.includes("user") && !isInternal
      : isInternal);

  return Response.json(
    { allowed },
    {
      status: allowed ? 200 : 403,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
