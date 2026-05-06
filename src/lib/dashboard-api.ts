/** Replace with real API routes / server actions; shape matches UI contract. */

export type DashboardOverview = {
  bookingsTotal: number;
  bookingsDeltaPct: number;
  revenueUsd: number;
  revenueDeltaPct: number;
  newClients: number;
  scheduleFillPct: number;
  pendingRequests: number;
};

export type AgendaItem = {
  id: string;
  time: string;
  title: string;
  client: string;
  duration: string;
};

export type ActivityItem = {
  id: string;
  type: "payment" | "inquiry" | "reschedule";
  title: string;
  subtitle: string;
  time: string;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client not available");
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch("/api/dashboard/overview", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load dashboard overview");
  }

  return res.json();
}

export async function fetchAgenda(): Promise<AgendaItem[]> {
  await delay(220);
  return [
    {
      id: "1",
      time: "09:00 AM",
      title: "Executive Consulting Session",
      client: "Priya Mehta",
      duration: "60 min",
    },
    {
      id: "2",
      time: "11:30 AM",
      title: "Design review",
      client: "Rahul Verma",
      duration: "45 min",
    },
    {
      id: "3",
      time: "02:00 PM",
      title: "Follow-up call",
      client: "Neha Kapoor",
      duration: "30 min",
    },
  ];
}

export async function fetchActivity(): Promise<ActivityItem[]> {
  await delay(200);
  return [
    {
      id: "1",
      type: "payment",
      title: "Payment received",
      subtitle: "₹4,500 · Initial consult",
      time: "12 min ago",
    },
    {
      id: "2",
      type: "inquiry",
      title: "New inquiry",
      subtitle: "Website contact form",
      time: "1 hr ago",
    },
    {
      id: "3",
      type: "reschedule",
      title: "Meeting rescheduled",
      subtitle: "Thu → Fri, same slot",
      time: "3 hr ago",
    },
  ];
}
