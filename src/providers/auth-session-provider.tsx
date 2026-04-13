"use client";

import { useEffect, type ReactNode } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

type ProfilePayload = {
  id: string;
  email: string;
  fullName: string;
};

async function upsertProfile(payload: ProfilePayload) {
  const res = await fetch("/api/auth/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to sync user profile");
  return (await res.json()) as {
    user: { id: string; email: string; name: string; plan: "FREE" | "PRO"; role: "Free host" | "Pro host" };
  };
}

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
      const sessionUser = data.session?.user;
      if (!sessionUser) {
        if (active) {
          clearUser();
          setLoading(false);
        }
      } else {
        try {
          const name = sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User";
          const result = await upsertProfile({
            id: sessionUser.id,
            email: sessionUser.email ?? "",
            fullName: name,
          });
          if (active) setUser(result.user);
        } catch {
          if (active) clearUser();
        } finally {
          if (active) setLoading(false);
        }
      }

      const { data: listener } = client.auth.onAuthStateChange(async (_event, session) => {
        const sessionUser = session?.user;
        if (!sessionUser) {
          clearUser();
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const name = sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User";
          const result = await upsertProfile({
            id: sessionUser.id,
            email: sessionUser.email ?? "",
            fullName: name,
          });
          setUser(result.user);
        } catch {
          clearUser();
        } finally {
          setLoading(false);
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
