"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { clearAuthProfileQueries, fetchAuthProfile } from "@/lib/auth/profile-query";
import { authUserFromSession } from "@/lib/auth/session-user";
import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function bootstrap() {
      setLoading(true);
      const client = await getSupabaseBrowserClient();
      if (!client) {
        if (active) {
          clearUser();
          setLoading(false);
        }
        return;
      }

      const { data } = await client.auth.getSession();
      const session = data.session;
      const sessionUser = session?.user;
      const accessToken = session?.access_token;
      if (!sessionUser) {
        if (active) {
          clearUser();
          setLoading(false);
        }
      } else if (accessToken) {
        try {
          const user = await fetchAuthProfile(queryClient, sessionUser.id);
          if (active) setUser(user);
        } catch {
          if (active) setUser(authUserFromSession(sessionUser));
        } finally {
          if (active) setLoading(false);
        }
      } else {
        if (active) setUser(authUserFromSession(sessionUser));
        if (active) setLoading(false);
      }

      const { data: listener } = client.auth.onAuthStateChange(async (event, session) => {
        const sessionUser = session?.user;
        const accessToken = session?.access_token;
        if (!sessionUser) {
          clearAuthProfileQueries(queryClient);
          clearUser();
          setLoading(false);
          return;
        }

        const quiet =
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED";

        if (!quiet) {
          setLoading(true);
        }
        try {
          if (accessToken) {
            if (event === "USER_UPDATED") {
              await queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(sessionUser.id) });
            }
            const user = await fetchAuthProfile(queryClient, sessionUser.id);
            setUser(user);
          } else {
            setUser(authUserFromSession(sessionUser));
          }
        } catch {
          setUser(authUserFromSession(sessionUser));
        } finally {
          if (!quiet) {
            setLoading(false);
          }
        }
      });

      unsubscribe = () => listener.subscription.unsubscribe();
    }

    bootstrap();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [clearUser, queryClient, setLoading, setUser]);

  return children;
}
