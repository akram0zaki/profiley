import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

let _service: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (_service) return _service;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  _service = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-client-info": "profiley-edge" } },
  });
  return _service;
}
