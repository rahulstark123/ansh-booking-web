import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | undefined;

function clientFromInlineEnv(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Browser Supabase client. Uses inlined NEXT_PUBLIC_* when present.
 * Otherwise loads from /api/supabase-config so production works even if env was added after build.
 */
export async function getSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient;

  const inline = clientFromInlineEnv();
  if (inline) {
    cachedClient = inline;
    return inline;
  }

  try {
    const res = await fetch("/api/supabase-config", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string; anonKey?: string };
    if (!data.url || !data.anonKey) return null;
    cachedClient = createClient(data.url, data.anonKey);
    return cachedClient;
  } catch {
    return null;
  }
}
