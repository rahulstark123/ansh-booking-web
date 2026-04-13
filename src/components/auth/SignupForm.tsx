"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useToast } from "@/components/ui/ToastProvider";
import { authUserFromSession } from "@/lib/auth/session-user";
import { upsertUserProfile } from "@/lib/auth/upsert-user-profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export function SignupForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [name, setName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex@example.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

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

      // Email confirmation ON → no session until user clicks link; DB trigger can still add profile.
      if (session && signedUpUser?.id) {
        try {
          const result = await upsertUserProfile({
            id: signedUpUser.id,
            email: signedUpUser.email ?? email.trim(),
            fullName: name.trim(),
          });
          useAuthStore.getState().setUser(result.user);
          showToast({ kind: "success", title: "Account created", message: "Your workspace is ready." });
          router.push("/dashboard");
        } catch {
          useAuthStore.getState().setUser(authUserFromSession(signedUpUser, name.trim()));
          showToast({
            kind: "info",
            title: "Account ready",
            message: "You’re signed in. We’ll save your full profile when the database is available.",
          });
          router.push("/dashboard");
        }
        return;
      }

      if (signedUpUser?.id) {
        showToast({
          kind: "info",
          title: "Confirm your email",
          message: "We sent you a link. After you confirm, sign in — your profile will sync then (or use the auth trigger in scripts/).",
        });
        router.push("/login");
        return;
      }

      showToast({ kind: "error", title: "Signup incomplete", message: "No user was returned. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Full name
        </label>
        <input
          id="signup-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
        />
      </div>
      <div>
        <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
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
        Create account
      </button>
      <p className="text-center text-xs text-zinc-500">Your account is created securely with Supabase Auth.</p>
      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--app-primary)] transition hover:text-[var(--app-primary-hover)]">
          Sign in
        </Link>
      </p>
    </form>
  );
}
