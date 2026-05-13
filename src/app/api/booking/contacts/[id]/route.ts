import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

function supabaseUrlAndAnonKey(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;
  if (!url?.trim() || !anonKey?.trim()) return null;
  return { url: url.trim(), anonKey: anonKey.trim() };
}

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const t = h.slice(7).trim();
  return t || null;
}

async function authHost(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return { error: NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 }) };

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return { error: NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 }) };

  const supabase = createClient(cfg.url, cfg.anonKey);
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !authUser?.id) {
    return { error: NextResponse.json({ error: "Invalid or expired session." }, { status: 401 }) };
  }
  return { authUser };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authHost(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database error" }, { status: 503 });

  try {
    const contact = await prisma.contact.update({
      where: { id, hostId: auth.authUser.id },
      data: body,
    });
    return NextResponse.json(contact);
  } catch (e) {
    console.error("[api/booking/contacts/[id]][PATCH]", e);
    return NextResponse.json({ error: "Failed to update contact." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authHost(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database error" }, { status: 503 });

  try {
    await prisma.contact.delete({
      where: { id, hostId: auth.authUser.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("[api/booking/contacts/[id]][DELETE]", e);
    return NextResponse.json({ error: "Failed to delete contact." }, { status: 500 });
  }
}
