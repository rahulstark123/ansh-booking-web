"use client";

import { useEffect, type ReactNode } from "react";

import { authUserFromSession } from "@/lib/auth/session-user";
import { syncUserProfile } from "@/lib/auth/upsert-user-profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
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
          const result = await syncUserProfile(accessToken);
          if (active) setUser(result.user);
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
          clearUser();
          setLoading(false);
          return;
        }

        // INITIAL_SESSION duplicates bootstrap; TOKEN_REFRESHED often fires when returning to the tab.
        // Do not flip global `loading` — that triggers DashboardGate’s full-screen spinner.
        const quiet =
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED";

        if (!quiet) {
          setLoading(true);
        }
        try {
          if (accessToken) {
            const result = await syncUserProfile(accessToken);
            setUser(result.user);
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
  }, [clearUser, setLoading, setUser]);

  return children;
}
