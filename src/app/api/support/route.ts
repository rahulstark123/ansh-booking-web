import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

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

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authUser?.id) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error("[api/support GET]", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authUser?.id) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const body = await req.json();
  const { subject, message, attachments } = body;

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: authUser.id,
        subject: subject.trim(),
        message: message.trim(),
        attachments: attachments || [],
      },
    });

    await createNotification({
      userId: authUser.id,
      title: "Support Ticket Created",
      message: `We've received your ticket: "${subject.trim()}". Our team will review it shortly.`,
      type: "system",
      link: "/dashboard/support",
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("[api/support POST]", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get("id");

  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
  }

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authUser?.id) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  try {
    // Ensure the ticket belongs to the user
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || ticket.userId !== authUser.id) {
      return NextResponse.json({ error: "Ticket not found or access denied" }, { status: 404 });
    }

    await prisma.supportTicket.delete({
      where: { id: ticketId },
    });

    return NextResponse.json({ success: true, message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("[api/support DELETE]", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
