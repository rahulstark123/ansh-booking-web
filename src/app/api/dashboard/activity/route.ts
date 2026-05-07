import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const t = h.slice(7).trim();
  return t || null;
}

export async function GET(req: Request) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { wid: true }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const wid = profile.wid;

    // Fetch top 3 most recent records from relevant tables
    const [bookings, payments, contacts] = await Promise.all([
      prisma.bookedMeeting.findMany({
        where: { wid },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, guestName: true, createdAt: true }
      }),
      prisma.transaction.findMany({
        where: { wid, status: "SUCCESS" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, amount: true, description: true, createdAt: true }
      }),
      prisma.contact.findMany({
        where: { wid },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, fullName: true, createdAt: true }
      })
    ]);

    // Map to ActivityItem format
    const activities = [
      ...bookings.map(b => ({
        id: b.id,
        type: "inquiry" as const, // Reusing icon type
        title: "New Booking",
        subtitle: `${b.guestName} booked a meeting`,
        createdAt: b.createdAt
      })),
      ...payments.map(p => ({
        id: p.id,
        type: "payment" as const,
        title: "Payment received",
        subtitle: `₹${(p.amount / 100).toLocaleString("en-IN")} · ${p.description || "Meeting fee"}`,
        createdAt: p.createdAt
      })),
      ...contacts.map(c => ({
        id: c.id,
        type: "reschedule" as const, // Reusing icon type
        title: "New Contact",
        subtitle: `${c.fullName} added to your list`,
        createdAt: c.createdAt
      }))
    ];

    // Sort all by createdAt desc and take top 3
    const top3 = activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3)
      .map(a => ({
        id: a.id,
        type: a.type,
        title: a.title,
        subtitle: a.subtitle,
        time: formatTimeAgo(a.createdAt)
      }));

    return NextResponse.json(top3);
  } catch (error) {
    console.error("[api/dashboard/activity]", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
