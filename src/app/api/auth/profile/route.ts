import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
    }

    const body = (await req.json()) as {
      id?: string;
      email?: string;
      fullName?: string;
    };

    if (!body.id || !body.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

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
    console.error(error);
    return NextResponse.json({ error: "Failed to sync profile" }, { status: 500 });
  }
}
