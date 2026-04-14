"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchBookedMeetings } from "@/lib/meetings-api";
import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const stale = 60 * 1000;

export function useBookedMeetings(
  hostId: string | undefined,
  params: { page: number; pageSize: number; filter: "all" | "upcoming" | "completed" },
) {
  return useQuery({
    queryKey: queryKeys.bookedMeetings.list(
      hostId ?? "__",
      params.page,
      params.pageSize,
      params.filter,
    ),
    queryFn: async () => {
      const client = await getSupabaseBrowserClient();
      if (!client) throw new Error("Supabase not configured");
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) throw new Error("Not signed in");
      return fetchBookedMeetings(data.session.access_token, params);
    },
    enabled: Boolean(hostId),
    staleTime: stale,
  });
}
