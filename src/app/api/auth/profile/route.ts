import { Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getPrisma, getPrismaConfigurationError } from "@/lib/prisma";

function supabaseUrlAndAnonKey(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;
  if (!url?.trim() || !anonKey?.trim()) return null;
  return { url: url.trim(), anonKey: anonKey.trim() };
}

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

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const t = h.slice(7).trim();
  return t || null;
}

/**
 * GET — load or create the profile for the signed-in user.
 * Auth: `Authorization: Bearer <supabase access_token>` (from `session.access_token`).
 */
export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header (expected Bearer token)." },
      { status: 401 },
    );
  }

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) {
    return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });
  }

  const supabase = createClient(cfg.url, cfg.anonKey);
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !authUser?.id || !authUser.email) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  const meta = authUser.user_metadata;
  const fromMeta = meta && typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const fullName = fromMeta || authUser.email.split("@")[0] || "User";

  const prisma = getPrisma();
  if (!prisma) {
    const err = getPrismaConfigurationError();
    return NextResponse.json(
      {
        error: err?.message ?? "Database client is not available",
        code: err?.code ?? "missing_database_url",
      },
      { status: 503 },
    );
  }

  try {
    const profile = await prisma.userProfile.upsert({
      where: { id: authUser.id },
      update: {
        email: authUser.email,
        fullName,
      },
      create: {
        id: authUser.id,
        email: authUser.email,
        fullName,
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
      return NextResponse.json(
        fallbackUser({ id: authUser.id, email: authUser.email, fullName }),
      );
    }
    const prismaCode =
      error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
    const p1001Hint =
      prismaCode === "P1001"
        ? {
            hint:
              "Cannot reach Postgres from this host. Use Supabase Session pooler (*.pooler.supabase.com, port 5432), not db.*.supabase.co.",
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
