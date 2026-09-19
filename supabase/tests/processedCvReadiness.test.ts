import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hasProcessedCv, resolvePublicAiCapabilities } from "../functions/_shared/readiness/processedCv.ts";

Deno.test("resolvePublicAiCapabilities disables public AI when processed CV readiness is missing", () => {
  assertEquals(
    resolvePublicAiCapabilities({
      allowPublicChat: true,
      allowJobFitAnalysis: true,
      processedCvReady: false,
      publicJobFitEnabled: true,
    }),
    {
      allowPublicChat: false,
      allowJobFitAnalysis: false,
    },
  );
});

Deno.test("resolvePublicAiCapabilities preserves enabled flags when processed CV readiness is met", () => {
  assertEquals(
    resolvePublicAiCapabilities({
      allowPublicChat: true,
      allowJobFitAnalysis: true,
      processedCvReady: true,
      publicJobFitEnabled: true,
    }),
    {
      allowPublicChat: true,
      allowJobFitAnalysis: true,
    },
  );
});

Deno.test("hasProcessedCv returns true when a completed CV exists", async () => {
  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ count: 1, error: null }),
          }),
        }),
      }),
    }),
  };

  assertEquals(await hasProcessedCv(supabase, "user-1"), true);
});

Deno.test("hasProcessedCv returns false when no completed CV exists", async () => {
  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ count: 0, error: null }),
          }),
        }),
      }),
    }),
  };

  assertEquals(await hasProcessedCv(supabase, "user-1"), false);
});

Deno.test("hasProcessedCv surfaces query errors", async () => {
  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ count: null, error: new Error("boom") }),
          }),
        }),
      }),
    }),
  };

  await assertRejects(() => hasProcessedCv(supabase, "user-1"), Error, "boom");
});