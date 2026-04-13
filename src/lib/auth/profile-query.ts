import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { syncUserProfile, type ProfileUser } from "./upsert-user-profile";

/** Profile rarely changes; avoids refetch on tab focus / TOKEN_REFRESHED when still fresh. */
export const AUTH_PROFILE_STALE_MS = 5 * 60 * 1000;

async function getAccessToken(): Promise<string | null> {
  const client = await getSupabaseBrowserClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Loads/creates DB profile via GET /api/auth/profile, cached by Supabase user id.
 * Reuses TanStack Query cache: no network while `staleTime` is satisfied.
 */
export function fetchAuthProfile(queryClient: QueryClient, userId: string): Promise<ProfileUser> {
  return queryClient.fetchQuery({
    queryKey: queryKeys.auth.profile(userId),
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing session");
      const { user } = await syncUserProfile(token);
      return user;
    },
    staleTime: AUTH_PROFILE_STALE_MS,
  });
}

export function clearAuthProfileQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: queryKeys.auth.root });
}
