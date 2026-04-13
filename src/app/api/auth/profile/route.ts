import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/** Only true “schema missing” — do not mask connection/SSL failures as a fake profile. */
function isRecoverableDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021";
  }
  const msg = String(error);
  return msg.includes("does not exist") || msg.includes("42P01");
}

function fallbackUser(body: { id: string; email: string; fullName?: string }) {
  const name = body.fullName?.trim() || body.email.split("@")[0] || "User";
  return {
    user: {
      id: body.id,
      email: body.email,
      name,
      plan: "FREE" as const,
      role: "Free host" as const,
    },
  };
}

export async function POST(req: NextRequest) {
  let body: { id?: string; email?: string; fullName?: string };
  try {
    body = (await req.json()) as { id?: string; email?: string; fullName?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.id || !body.email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set on the server", code: "missing_database_url" },
      { status: 503 },
    );
  }

  try {
    const profile = await prisma.userProfile.upsert({
      where: { id: body.id },
      update: {
        email: body.email,
        fullName: body.fullName?.trim() || body.email.split("@")[0] || "User",
      },
      create: {
        id: body.id,
        email: body.email,
        fullName: body.fullName?.trim() || body.email.split("@")[0] || "User",
      },
    });

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.fullName,
        plan: profile.plan,
        role: profile.plan === "PRO" ? "Pro host" : "Free host",
      },
    });
  } catch (error) {
    console.error("[api/auth/profile]", error);
    if (isRecoverableDbError(error)) {
      return NextResponse.json(fallbackUser(body as { id: string; email: string; fullName?: string }));
    }
    const prismaCode =
      error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
    const p1001Hint =
      prismaCode === "P1001"
        ? {
            hint:
              "Cannot reach Postgres from this host. On Vercel, use Supabase Session pooler (*.pooler.supabase.com, port 5432), not db.*.supabase.co. If DATABASE_URL is the 6543 pooler string, redeploy — the app derives the 5432 session URL automatically.",
          }
        : {};
    return NextResponse.json(
      {
        error: "Failed to sync profile",
        ...(prismaCode ? { prismaCode } : {}),
        ...p1001Hint,
      },
      { status: 500 },
    );
  }
}
