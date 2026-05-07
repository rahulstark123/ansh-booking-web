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
  date: string;
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
      date: "May 10",
      title: "Executive Consulting Session",
      client: "Priya Mehta",
      duration: "60 min",
    },
    {
      id: "2",
      time: "11:30 AM",
      date: "May 10",
      title: "Design review",
      client: "Rahul Verma",
      duration: "45 min",
    },
    {
      id: "3",
      time: "02:00 PM",
      date: "May 11",
      title: "Follow-up call",
      client: "Neha Kapoor",
      duration: "30 min",
    },
    {
      id: "4",
      time: "10:00 AM",
      date: "May 12",
      title: "Product Strategy",
      client: "Amit Shah",
      duration: "60 min",
    },
    {
      id: "5",
      time: "03:30 PM",
      date: "May 12",
      title: "Technical Interview",
      client: "Suresh Raina",
      duration: "45 min",
    },
  ];
}

export async function fetchActivity(): Promise<ActivityItem[]> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client not available");
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch("/api/dashboard/activity", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load activities");
  }

  return res.json();
}
