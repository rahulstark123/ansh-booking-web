import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import type { DashboardOverview } from "@/lib/dashboard-api";

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

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 });
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
  
  if (authError || !authUser?.id) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const hostId = authUser.id;

    const [bookedCount, scheduledCount] = await Promise.all([
      prisma.bookedMeeting.count({ where: { hostId } }),
      prisma.scheduledMeeting.count({ where: { hostId } })
    ]);
    const bookingsTotal = bookedCount + scheduledCount;

    const paidBookings = await prisma.bookedMeeting.findMany({
      where: { hostId, razorpayPaymentId: { not: null } },
      select: { eventType: { select: { paymentAmountPaisa: true } } }
    });

    const revenuePaisa = paidBookings.reduce((sum, b) => {
      return sum + (b.eventType?.paymentAmountPaisa || 0);
    }, 0);
    const revenueUsd = Math.floor(revenuePaisa / 100);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newClients = await prisma.contact.count({
      where: {
        hostId,
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Provide mock values for UI fields that don't have clear db sources yet
    const overview: DashboardOverview = {
      bookingsTotal,
      bookingsDeltaPct: 0, // Could be calculated comparing previous periods
      revenueUsd,
      revenueDeltaPct: 0,
      newClients,
      scheduleFillPct: 85, // Mock
      pendingRequests: 4, // Mock
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error("[api/dashboard/overview][GET]", error);
    return NextResponse.json({ error: "Failed to fetch dashboard overview." }, { status: 500 });
  }
}
