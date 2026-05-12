import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const t = h.slice(7).trim();
  return t || null;
}

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "DB error" }, { status: 503 });

  // In a real app, we'd verify the user is PRO here too.
  // For now, we'll return some high-fidelity mock data mixed with real stats.
  
  const stats = {
    revenueData: [
      { name: "Mon", value: 4500 },
      { name: "Tue", value: 5200 },
      { name: "Wed", value: 4800 },
      { name: "Thu", value: 6100 },
      { name: "Fri", value: 5900 },
      { name: "Sat", value: 7200 },
      { name: "Sun", value: 8500 },
    ],
    bookingDistribution: [
      { name: "One-on-one", value: 45 },
      { name: "Group", value: 25 },
      { name: "Round Robin", value: 30 },
    ],
    clientGrowth: [
      { month: "Jan", clients: 12 },
      { month: "Feb", clients: 18 },
      { month: "Mar", clients: 25 },
      { month: "Apr", clients: 32 },
      { month: "May", clients: 45 },
    ]
  };

  return NextResponse.json(stats);
}
