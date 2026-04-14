"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { clearAuthProfileQueries, fetchAuthProfile } from "@/lib/auth/profile-query";
import { authUserFromSession } from "@/lib/auth/session-user";
import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

const AUTH_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Operation timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

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
      try {
        const client = await withTimeout(getSupabaseBrowserClient(), AUTH_TIMEOUT_MS);
        if (!client) {
          if (active) setLoading(false);
          return;
        }

        const {
          data: { session },
        } = await withTimeout(client.auth.getSession(), AUTH_TIMEOUT_MS);
        const sessionUser = session?.user;
        const accessToken = session?.access_token;
        if (!sessionUser) {
          if (active) {
            clearUser();
            setLoading(false);
          }
        } else if (accessToken) {
          try {
            const user = await withTimeout(fetchAuthProfile(queryClient, sessionUser.id), AUTH_TIMEOUT_MS);
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

          const quiet = event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED";

          if (!quiet) {
            setLoading(true);
          }
          try {
            if (accessToken) {
              if (event === "USER_UPDATED") {
                await queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(sessionUser.id) });
              }
              const user = await withTimeout(fetchAuthProfile(queryClient, sessionUser.id), AUTH_TIMEOUT_MS);
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
      } catch {
        // Avoid infinite spinner when browser resumes from long sleep/background throttling.
        if (active) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [clearUser, queryClient, setLoading, setUser]);

  return children;
}
