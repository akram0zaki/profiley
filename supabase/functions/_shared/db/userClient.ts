import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/** Returns a Supabase client bound to the caller's JWT, so RLS applies. */
export function getUserClient(req: Request): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) {
    throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set");
  }
  const auth = req.headers.get("authorization") ?? "";
  return createClient(url, anon, {
    global: { headers: { authorization: auth } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
