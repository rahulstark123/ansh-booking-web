"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWeeklyAvailability } from "@/lib/availability-api";
import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const stale = 60 * 1000;

export function useWeeklyAvailability(hostId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.availability.weekly(hostId ?? "__"),
    queryFn: async () => {
      const client = await getSupabaseBrowserClient();
      if (!client) throw new Error("Supabase not configured");
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) throw new Error("Not signed in");
      return fetchWeeklyAvailability(data.session.access_token);
    },
    enabled: Boolean(hostId),
    staleTime: stale,
  });
}
