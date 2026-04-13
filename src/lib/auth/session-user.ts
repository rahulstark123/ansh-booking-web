import type { AuthUser } from "@/stores/auth-store";

type SessionLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

/** Build app user from Supabase session when Postgres profile sync is unavailable. */
export function authUserFromSession(sessionUser: SessionLike, fullNameHint?: string): AuthUser {
  const meta = sessionUser.user_metadata;
  const fromMeta =
    meta && typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const name =
    fullNameHint?.trim() || fromMeta || sessionUser.email?.split("@")[0] || "User";
  return {
    id: sessionUser.id,
    email: sessionUser.email ?? "",
    name,
    plan: "FREE",
    role: "Free host",
  };
}
