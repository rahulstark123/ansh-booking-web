"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useToast } from "@/components/ui/ToastProvider";
import { fetchAuthProfile } from "@/lib/auth/profile-query";
import { authUserFromSession } from "@/lib/auth/session-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export function SignupForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [router, user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ kind: "error", title: "Name is required", message: "Please enter your full name." });
      return;
    }
    if (!email.trim()) {
      showToast({ kind: "error", title: "Email is required", message: "Please enter your email address." });
      return;
    }
    if (!password.trim()) {
      showToast({ kind: "error", title: "Password is required", message: "Please create a password." });
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
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });
      if (error) {
        showToast({ kind: "error", title: "Signup failed", message: error.message });
        return;
      }

      const signedUpUser = data.user;
      const session = data.session;

      if (signedUpUser?.id) {
        let syncedProfile = false;
        const accessToken = session?.access_token;
        if (session && accessToken) {
          try {
            const profileUser = await fetchAuthProfile(queryClient, signedUpUser.id);
            syncedProfile = true;
            useAuthStore.getState().setUser(profileUser);
          } catch {
            useAuthStore.getState().setUser(authUserFromSession(signedUpUser, name.trim()));
          }
          showToast(
            syncedProfile
              ? { kind: "success", title: "Account created", message: "Your workspace is ready." }
              : {
                  kind: "info",
                  title: "Account ready",
                  message: "You’re signed in. We’ll save your full profile when the database is available.",
                },
          );
          router.push("/dashboard");
          return;
        }

        showToast({
          kind: "info",
          title: "Confirm your email",
          message:
            "We sent you a link. After you confirm and sign in, your profile will sync (or use the auth trigger in scripts/).",
        });
        router.push("/login");
        return;
      }

      showToast({ kind: "error", title: "Signup incomplete", message: "No user was returned. Try again." });
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
        showToast({ kind: "error", title: "Google signup failed", message: error.message });
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
            <label htmlFor="signup-name" className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
              Full Name
            </label>
            <input
              id="signup-name"
              name="name"
              autoComplete="name"
              placeholder="Alex Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-email" className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
              Email Address
            </label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password" className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
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
          {busy ? "Creating account..." : "Create Workspace"}
        </span>
      </button>

      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-teal-600 transition-colors hover:text-teal-700 underline underline-offset-4 decoration-teal-600/30">
          Sign in
        </Link>
      </p>
    </form>
  );
}
