import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildRetentionCutoffs,
  isExpiredByRetention,
  RETENTION_WINDOWS_DAYS,
  retentionCutoffIso,
} from "../functions/_shared/retention.ts";

Deno.test("retentionCutoffIso: subtracts the configured number of days", () => {
  assertEquals(
    retentionCutoffIso("2026-05-03T00:00:00.000Z", 90),
    "2026-02-02T00:00:00.000Z",
  );
});

Deno.test("buildRetentionCutoffs: returns the enforced window for every retained table", () => {
  const cutoffs = buildRetentionCutoffs("2026-05-03T00:00:00.000Z");
  assertEquals(cutoffs.recruiter_visits, "2026-02-02T00:00:00.000Z");
  assertEquals(cutoffs.recruiter_events, "2025-11-04T00:00:00.000Z");
  assertEquals(cutoffs.ai_call_logs, "2025-11-04T00:00:00.000Z");
  assertEquals(cutoffs.moderation_events, "2025-05-03T00:00:00.000Z");
  assertEquals(cutoffs.job_fit_analyses, "2025-05-03T00:00:00.000Z");
  assertEquals(RETENTION_WINDOWS_DAYS.ai_call_logs, 180);
});

Deno.test("isExpiredByRetention: keeps newer rows and purges cutoff-or-older rows", () => {
  const cutoff = "2026-02-02T00:00:00.000Z";
  assertEquals(isExpiredByRetention("2026-02-01T23:59:59.000Z", cutoff), true);
  assertEquals(isExpiredByRetention("2026-02-02T00:00:00.000Z", cutoff), true);
  assertEquals(isExpiredByRetention("2026-02-02T00:00:01.000Z", cutoff), false);
});