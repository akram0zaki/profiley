import { z } from "../_shared/validation/schemas.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { buildRetentionCutoffs } from "../_shared/retention.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { handlePreflight } from "../_shared/utils/cors.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

const Body = z.object({
  limitPerTable: z.number().int().positive().max(5000).optional(),
}).default({});

const PURGE_ORDER = [
  "recruiter_visits",
  "recruiter_events",
  "ai_call_logs",
  "moderation_events",
  "job_fit_analyses",
] as const;

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "process-retention-purge");

  try {
    if (req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    }

    const expected = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    if (!expected || provided !== expected) {
      throw new AppError("UNAUTHORIZED_CRON", "Invalid cron secret", 401);
    }

    const body = Body.parse(await req.json().catch(() => ({})));
    const supabase = getServiceClient();
    const nowIso = new Date().toISOString();
    const cutoffs = buildRetentionCutoffs(nowIso);
    const limitPerTable = body.limitPerTable ?? 2000;
    const results: Array<{ table: string; cutoff: string; deleted: number }> = [];

    for (const table of PURGE_ORDER) {
      const cutoff = cutoffs[table];
      const { data: rows, error } = await supabase
        .from(table)
        .delete()
        .lte("created_at", cutoff)
        .limit(limitPerTable)
        .select("id");

      if (error) throw error;
      results.push({ table, cutoff, deleted: rows?.length ?? 0 });
    }

    log.info("purged", { results });
    return respond(req, { purgedAt: nowIso, results });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});