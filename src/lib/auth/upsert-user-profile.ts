export type ProfileUser = {
  id: string;
  email: string;
  name: string;
  plan: "FREE" | "PRO";
  role: "Free host" | "Pro host";
  avatarUrl?: string | null;
};

/**
 * Loads or creates the DB profile for the current Supabase session (GET /api/auth/profile).
 * Pass `session.access_token` from the browser client.
 */
export async function syncUserProfile(accessToken: string): Promise<{ user: ProfileUser }> {
  const res = await fetch("/api/auth/profile", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to sync user profile");
  return (await res.json()) as { user: ProfileUser };
}
