"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { useToast } from "@/components/ui/ToastProvider";
import { authUserFromSession } from "@/lib/auth/session-user";
import { syncUserProfile } from "@/lib/auth/upsert-user-profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export function LoginForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [email, setEmail] = useState("alex@example.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [router, user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      showToast({ kind: "error", title: "Email is required", message: "Please enter your email address." });
      return;
    }
    if (!password.trim()) {
      showToast({ kind: "error", title: "Password is required", message: "Please enter your password." });
      return;
    }
    setBusy(true);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) {
        showToast({
          kind: "error",
          title: "Configuration error",
          message: "Supabase is not configured. Add env vars in Vercel and redeploy.",
        });
        return;
      }
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        showToast({ kind: "error", title: "Sign in failed", message: error.message });
        return;
      }
      const sessionUser = data.session?.user ?? data.user;
      const accessToken = data.session?.access_token;
      if (sessionUser?.id && accessToken) {
        try {
          const result = await syncUserProfile(accessToken);
          useAuthStore.getState().setUser(result.user);
        } catch {
          useAuthStore.getState().setUser(authUserFromSession(sessionUser));
          showToast({
            kind: "info",
            title: "Signed in",
            message: "You’re signed in. Profile data will sync when the database is available.",
          });
          router.push("/dashboard");
          return;
        }
      } else if (sessionUser?.id && !accessToken) {
        useAuthStore.getState().setUser(authUserFromSession(sessionUser));
      }
      showToast({ kind: "success", title: "Signed in", message: "Welcome back to your workspace." });
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-[var(--app-primary)] py-2.5 text-sm font-semibold text-[var(--app-primary-foreground)] shadow-sm transition hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
      >
        Continue
      </button>
      <p className="text-center text-xs text-zinc-500">Sign in using your account credentials.</p>
      <p className="text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-[var(--app-primary)] transition hover:text-[var(--app-primary-hover)]">
          Create account
        </Link>
      </p>
    </form>
  );
}
