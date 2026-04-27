import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { AppError, respond, respondError } from "../functions/_shared/utils/errors.ts";

function makeReq() {
  return new Request("http://x", { headers: { origin: "http://localhost:5173" } });
}

Deno.test("respond: wraps data in success envelope", async () => {
  const res = respond(makeReq(), { hello: "world" });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, { success: true, data: { hello: "world" }, error: null });
  assertEquals(res.headers.get("content-type"), "application/json");
});

Deno.test("respond: includes meta when supplied and respects custom status", async () => {
  const res = respond(makeReq(), null, { status: 201, meta: { page: 1 } });
  assertEquals(res.status, 201);
  const body = await res.json();
  assertEquals(body.meta, { page: 1 });
});

Deno.test("respondError: AppError preserves code, status, details", async () => {
  const err = new AppError("VALIDATION_ERROR", "Bad input", 422, { field: "x" });
  const res = respondError(makeReq(), err);
  assertEquals(res.status, 422);
  const body = await res.json();
  assertEquals(body.success, false);
  assertEquals(body.error.code, "VALIDATION_ERROR");
  assertEquals(body.error.message, "Bad input");
  assertEquals(body.error.details, { field: "x" });
});

Deno.test("respondError: generic Error becomes INTERNAL_ERROR with fallback status", async () => {
  const res = respondError(makeReq(), new Error("boom"));
  assertEquals(res.status, 500);
  const body = await res.json();
  assertEquals(body.error.code, "INTERNAL_ERROR");
  assert(body.error.message.includes("boom"));
});

Deno.test("respondError: unknown values still produce a structured envelope", async () => {
  const res = respondError(makeReq(), "weird");
  assertEquals(res.status, 500);
  const body = await res.json();
  assertEquals(body.success, false);
  assertEquals(body.error.code, "INTERNAL_ERROR");
});
