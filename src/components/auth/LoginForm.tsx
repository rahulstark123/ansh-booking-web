"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { useToast } from "@/components/ui/ToastProvider";
import { fetchAuthProfile } from "@/lib/auth/profile-query";
import { authUserFromSession } from "@/lib/auth/session-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export function LoginForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [email, setEmail] = useState("alex@example.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);

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
          const profileUser = await fetchAuthProfile(queryClient, sessionUser.id);
          useAuthStore.getState().setUser(profileUser);
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

  async function handleGoogleContinue() {
    setOauthBusy(true);
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

      const redirectTo = `${window.location.origin}/dashboard`;
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        showToast({ kind: "error", title: "Google sign-in failed", message: error.message });
      }
    } finally {
      setOauthBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleContinue}
          disabled={busy || oauthBusy}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.2 14.5 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12z"
            />
          </svg>
          {oauthBusy ? "Redirecting..." : "Continue with Google"}
        </button>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-zinc-100" />
          <span className="mx-4 flex-shrink text-[10px] font-bold uppercase tracking-widest text-zinc-400">or</span>
          <div className="flex-grow border-t border-zinc-100" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
              Email Address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Password
              </label>
              <Link href="#" className="text-[10px] font-bold uppercase tracking-wider text-teal-600 hover:text-teal-700">
                Forgot?
              </Link>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="group relative w-full overflow-hidden rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98]"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {busy ? "Signing in..." : "Sign in to Workspace"}
        </span>
      </button>

      <p className="text-center text-sm text-zinc-600">
        New to ANSH?{" "}
        <Link href="/signup" className="font-bold text-teal-600 transition-colors hover:text-teal-700 underline underline-offset-4 decoration-teal-600/30">
          Create an account
        </Link>
      </p>
    </form>
  );
}
