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
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client not available");
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch("/api/dashboard/agenda", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load dashboard agenda");
  }

  return res.json();
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

export type AnalyticsData = {
  revenueData: { name: string; value: number }[];
  bookingDistribution: { name: string; value: number }[];
  clientGrowth: { month: string; clients: number }[];
};

export async function fetchAdvancedAnalytics(): Promise<AnalyticsData> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client not available");
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch("/api/dashboard/analytics", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load analytics");
  }

  return res.json();
}
