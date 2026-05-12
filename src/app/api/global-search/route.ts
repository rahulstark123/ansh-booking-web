import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

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

export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const sb = supabaseUrlAndAnonKey();
  if (!sb) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const supabase = createClient(sb.url, sb.anonKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hostId = user.id;

  if (q.length < 2) {
    return NextResponse.json({ contacts: [], meetings: [] });
  }

  try {
    const [contacts, bookedMeetings, scheduledMeetings] = await Promise.all([
      prisma.contact.findMany({
        where: {
          hostId,
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.bookedMeeting.findMany({
        where: {
          hostId,
          OR: [
            { guestName: { contains: q, mode: "insensitive" } },
            { guestEmail: { contains: q, mode: "insensitive" } },
            { eventType: { eventName: { contains: q, mode: "insensitive" } } },
          ],
        },
        include: { eventType: true },
        take: 5,
        orderBy: { startsAt: "desc" },
      }),
      prisma.scheduledMeeting.findMany({
        where: {
          hostId,
          OR: [
            { guestName: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { startsAt: "desc" },
      }),
    ]);

    // Format results
    const contactResults = contacts.map((c) => ({
      id: c.id,
      name: c.fullName,
      email: c.email,
    }));

    const meetingResults = [
      ...bookedMeetings.map((m) => ({
        id: m.id,
        title: m.eventType.eventName,
        subtitle: `${m.guestName} (${m.guestEmail})`,
        date: m.startsAt,
      })),
      ...scheduledMeetings.map((m) => ({
        id: m.id,
        title: m.title,
        subtitle: m.guestName,
        date: m.startsAt,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);

    return NextResponse.json({
      contacts: contactResults,
      meetings: meetingResults,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
