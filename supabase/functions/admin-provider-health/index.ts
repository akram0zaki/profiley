// Aggregates ai_call_logs over the last N hours.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireAdmin } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (req.method !== "GET") throw new AppError("METHOD_NOT_ALLOWED", "GET required", 405);
    await requireAdmin(req);
    const url = new URL(req.url);
    const hours = Math.min(168, Math.max(1, Number(url.searchParams.get("hours") ?? "24")));
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    const supabase = getServiceClient();
    const { data: logs, error } = await supabase
      .from("ai_call_logs")
      .select("provider, capability, latency_ms, error_code, fallback_triggered, total_tokens, created_at")
      .gte("created_at", since)
      .limit(20000);
    if (error) throw error;

    const buckets = new Map<string, { calls: number; errors: number; fallback: number; latencies: number[]; tokens: number }>();
    for (const r of logs ?? []) {
      const key = `${r.provider}|${r.capability}`;
      const b = buckets.get(key) ?? { calls: 0, errors: 0, fallback: 0, latencies: [], tokens: 0 };
      b.calls++;
      if (r.error_code) b.errors++;
      if (r.fallback_triggered) b.fallback++;
      if (typeof r.latency_ms === "number") b.latencies.push(r.latency_ms);
      if (typeof r.total_tokens === "number") b.tokens += r.total_tokens;
      buckets.set(key, b);
    }
    const summary = Array.from(buckets.entries()).map(([key, b]) => {
      const sorted = b.latencies.sort((a, c) => a - c);
      const p = (q: number) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] : null;
      const [provider, capability] = key.split("|");
      return {
        provider, capability,
        calls: b.calls,
        errorRate: b.calls ? b.errors / b.calls : 0,
        fallbackRate: b.calls ? b.fallback / b.calls : 0,
        p50: p(0.5), p95: p(0.95),
        totalTokens: b.tokens,
      };
    });
    return respond(req, { hours, summary });
  } catch (err) {
    return respondError(req, err);
  }
});
