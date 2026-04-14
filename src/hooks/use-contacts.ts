"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchContacts } from "@/lib/contacts-api";
import type { FilterId } from "@/lib/contacts-data";
import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const stale = 60 * 1000;

export function useContacts(
  hostId: string | undefined,
  params: { page: number; pageSize: number; q: string; filter: FilterId },
) {
  return useQuery({
    queryKey: queryKeys.contacts.list(hostId ?? "__", params.q, params.filter, params.page, params.pageSize),
    queryFn: async () => {
      const client = await getSupabaseBrowserClient();
      if (!client) throw new Error("Supabase not configured");
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) throw new Error("Not signed in");
      return fetchContacts(data.session.access_token, params);
    },
    enabled: Boolean(hostId),
    staleTime: stale,
  });
}
