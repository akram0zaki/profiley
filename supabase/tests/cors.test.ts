// Tests for the shared CORS helpers.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { corsHeaders, handlePreflight, isOriginAllowed } from "../functions/_shared/utils/cors.ts";

Deno.test("isOriginAllowed: defaults allow localhost dev origins", () => {
  Deno.env.delete("ALLOWED_ORIGINS");
  assert(isOriginAllowed("http://localhost:5173"));
  assert(isOriginAllowed("http://127.0.0.1:5173"));
  assert(!isOriginAllowed("https://evil.example"));
  assert(!isOriginAllowed(null));
});

Deno.test("isOriginAllowed: env list with explicit + wildcard entries", () => {
  Deno.env.set("ALLOWED_ORIGINS", "https://app.example,https://*.preview.example");
  try {
    assert(isOriginAllowed("https://app.example"));
    assert(isOriginAllowed("https://feature-1.preview.example"));
    assert(!isOriginAllowed("https://app.example.evil"));
    assert(!isOriginAllowed("http://app.example"));
  } finally {
    Deno.env.delete("ALLOWED_ORIGINS");
  }
});

Deno.test("corsHeaders: echoes allowed origin, falls back to '*' otherwise", () => {
  Deno.env.set("ALLOWED_ORIGINS", "https://ok.example");
  try {
    const allowed = corsHeaders(
      new Request("http://x", { headers: { origin: "https://ok.example" } }),
    ) as Record<string, string>;
    assertEquals(allowed["Access-Control-Allow-Origin"], "https://ok.example");
    assertEquals(allowed["Vary"], "Origin");

    const denied = corsHeaders(
      new Request("http://x", { headers: { origin: "https://nope.example" } }),
    ) as Record<string, string>;
    assertEquals(denied["Access-Control-Allow-Origin"], "*");
  } finally {
    Deno.env.delete("ALLOWED_ORIGINS");
  }
});

Deno.test("handlePreflight: only handles OPTIONS", () => {
  const opts = handlePreflight(new Request("http://x", { method: "OPTIONS" }));
  assert(opts);
  assertEquals(opts!.status, 204);

  const post = handlePreflight(new Request("http://x", { method: "POST" }));
  assertEquals(post, null);
});
