import { assert, assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { clientIp, hashIp, visitorSessionFromHeader } from "../functions/_shared/utils/rateLimit.ts";

Deno.test("visitorSessionFromHeader: keeps a valid header value", async () => {
  const id = "session-abcdef0123456789";
  const out = await visitorSessionFromHeader(
    new Request("http://x", { headers: { "x-visitor-session": id } }),
  );
  assertEquals(out, id);
});

Deno.test("visitorSessionFromHeader: rejects too-short / too-long values and mints a UUID", async () => {
  const tooShort = await visitorSessionFromHeader(
    new Request("http://x", { headers: { "x-visitor-session": "abc" } }),
  );
  // Looks like a UUID v4-ish.
  assert(/^[0-9a-f-]{36}$/i.test(tooShort));

  const tooLong = await visitorSessionFromHeader(
    new Request("http://x", { headers: { "x-visitor-session": "x".repeat(200) } }),
  );
  assertNotEquals(tooLong, "x".repeat(200));
});

Deno.test("clientIp: prefers cf-connecting-ip, then x-forwarded-for, else 'unknown'", () => {
  assertEquals(
    clientIp(new Request("http://x", { headers: { "cf-connecting-ip": "1.2.3.4" } })),
    "1.2.3.4",
  );
  assertEquals(
    clientIp(new Request("http://x", { headers: { "x-forwarded-for": "5.6.7.8, 9.10.11.12" } })),
    "5.6.7.8",
  );
  assertEquals(clientIp(new Request("http://x")), "unknown");
});

Deno.test("hashIp: deterministic hex with the same secret, differs across secrets", async () => {
  Deno.env.set("VISITOR_SESSION_HMAC_SECRET", "secret-a");
  const a1 = await hashIp("1.2.3.4");
  const a2 = await hashIp("1.2.3.4");
  assertEquals(a1, a2);
  assert(/^[0-9a-f]{32}$/.test(a1)); // 16 bytes = 32 hex chars

  Deno.env.set("VISITOR_SESSION_HMAC_SECRET", "secret-b");
  const b = await hashIp("1.2.3.4");
  assertNotEquals(a1, b);
  Deno.env.delete("VISITOR_SESSION_HMAC_SECRET");
});
