"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAvailabilityOverrides } from "@/lib/availability-api";
import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const stale = 60 * 1000;

export function useAvailabilityOverrides(hostId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.availability.overrides(hostId ?? "__"),
    queryFn: async () => {
      const client = await getSupabaseBrowserClient();
      if (!client) throw new Error("Supabase not configured");
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) throw new Error("Not signed in");
      return fetchAvailabilityOverrides(data.session.access_token);
    },
    enabled: Boolean(hostId),
    staleTime: stale,
  });
}
