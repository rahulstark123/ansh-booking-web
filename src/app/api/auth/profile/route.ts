import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function isRecoverableDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2021: table does not exist, P1001: can't reach DB, P1017: server closed connection
    return ["P2021", "P1001", "P1017"].includes(error.code);
  }
  const msg = String(error);
  return (
    msg.includes("does not exist") ||
    msg.includes("42P01") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ETIMEDOUT")
  );
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
    return NextResponse.json(fallbackUser(body as { id: string; email: string; fullName?: string }));
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
    return NextResponse.json({ error: "Failed to sync profile" }, { status: 500 });
  }
}
