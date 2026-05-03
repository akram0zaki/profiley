import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildLegalAcceptancePatch,
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  hasAcceptedCurrentLegalVersions,
} from "../functions/_shared/legal.ts";

Deno.test("buildLegalAcceptancePatch: records the first acceptance for both documents", () => {
  const nowIso = "2026-05-03T12:00:00.000Z";
  const patch = buildLegalAcceptancePatch(
    {
      terms_accepted_at: null,
      privacy_accepted_at: null,
      terms_version: null,
      privacy_version: null,
      terms_acceptance_source: null,
      privacy_acceptance_source: null,
    },
    nowIso,
    "in_app_gate",
  );

  assertEquals(patch.terms_accepted_at, nowIso);
  assertEquals(patch.privacy_accepted_at, nowIso);
  assertEquals(patch.terms_version, CURRENT_TERMS_VERSION);
  assertEquals(patch.privacy_version, CURRENT_PRIVACY_VERSION);
  assertEquals(patch.terms_acceptance_source, "in_app_gate");
  assertEquals(patch.privacy_acceptance_source, "in_app_gate");
});

Deno.test("buildLegalAcceptancePatch: does not rewrite the same versions repeatedly", () => {
  const patch = buildLegalAcceptancePatch(
    {
      terms_accepted_at: "2026-05-03T10:00:00.000Z",
      privacy_accepted_at: "2026-05-03T10:00:00.000Z",
      terms_version: CURRENT_TERMS_VERSION,
      privacy_version: CURRENT_PRIVACY_VERSION,
      terms_acceptance_source: "in_app_gate",
      privacy_acceptance_source: "in_app_gate",
    },
    "2026-05-03T12:00:00.000Z",
    "in_app_gate",
  );

  assertEquals(Object.keys(patch).length, 0);
});

Deno.test("hasAcceptedCurrentLegalVersions: returns false when the published version changes", () => {
  assertEquals(
    hasAcceptedCurrentLegalVersions({
      terms_accepted_at: "2026-05-03T10:00:00.000Z",
      privacy_accepted_at: "2026-05-03T10:00:00.000Z",
      terms_version: "2026-04-27",
      privacy_version: CURRENT_PRIVACY_VERSION,
    }),
    false,
  );
});