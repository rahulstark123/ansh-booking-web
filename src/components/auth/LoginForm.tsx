"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [view, setView] = useState<"login" | "forgot">("login");

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
        setOauthBusy(false);
        return;
      }

      // Add a tiny delay to show the nice animation
      await new Promise(r => setTimeout(r, 1500));

      const redirectTo = `${window.location.origin}/dashboard`;
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        showToast({ kind: "error", title: "Google sign-in failed", message: error.message });
        setOauthBusy(false);
      }
    } catch (e) {
      setOauthBusy(false);
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      showToast({ 
        kind: "error", 
        title: "Email required", 
        message: "Please enter your email address to receive a reset link." 
      });
      return;
    }
    
    setBusy(true);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) return;
      
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/dashboard/settings?reset=true`,
      });
      
      if (error) {
        showToast({ kind: "error", title: "Reset failed", message: error.message });
      } else {
        showToast({ 
          kind: "success", 
          title: "Reset link sent", 
          message: "Check your email for the confirmation link to reset your password." 
        });
        setView("login");
      }
    } catch (err: any) {
      showToast({ kind: "error", title: "Error", message: err.message || "An unexpected error occurred." });
    } finally {
      setBusy(false);
    }
  }

  if (view === "forgot") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Forgot Password</h2>
          <p className="mt-2 text-sm font-medium text-zinc-500">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
              Email Address
            </label>
            <input
              id="reset-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              required
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98]"
          >
            {busy ? "Sending..." : "Send Reset Confirmation"}
          </button>

          <button
            type="button"
            onClick={() => setView("login")}
            className="w-full text-center text-sm font-bold text-teal-600 hover:text-teal-700"
          >
            Back to Sign in
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <>
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
            {oauthBusy ? "Connecting..." : "Continue with Google"}
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
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-[10px] font-bold uppercase tracking-wider text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Forgot?
                </button>
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

      <AnimatePresence>
        {oauthBusy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center p-8 rounded-3xl bg-white shadow-2xl border border-zinc-100 max-w-sm w-full mx-4"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 text-3xl shadow-inner">
                  🚀
                </div>
              </div>
              
              <h2 className="text-2xl font-black tracking-tight text-zinc-900">
                Connecting Account
              </h2>
              <p className="mt-3 font-bold text-zinc-500 leading-relaxed px-4">
                Please sit tight while we securely link your Google workspace...
              </p>
              
              <div className="mt-8 flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 1, 0.3],
                      backgroundColor: ["#14b8a6", "#0d9488", "#14b8a6"]
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.15
                    }}
                    className="h-2.5 w-2.5 rounded-full"
                  />
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-zinc-50 w-full">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                  Secure OAuth 2.0 Encryption
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
