export type ProfilePayload = {
  id: string;
  email: string;
  fullName: string;
};

export type ProfileUser = {
  id: string;
  email: string;
  name: string;
  plan: "FREE" | "PRO";
  role: "Free host" | "Pro host";
};

export async function upsertUserProfile(payload: ProfilePayload): Promise<{ user: ProfileUser }> {
  const res = await fetch("/api/auth/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to sync user profile");
  return (await res.json()) as { user: ProfileUser };
}
