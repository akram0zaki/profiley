// Tests for the shared requireUser auth helper.
// We stub getUserClient via env + a mocked fetch to ensure the user JWT
// is forwarded explicitly to supabase.auth.getUser().

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { AppError } from "../functions/_shared/utils/errors.ts";

Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "sb_publishable_test");

const { requireUser } = await import("../functions/_shared/auth/requireUser.ts");

type FetchCall = { url: string; headers: Headers };

function withMockedFetch(handler: (input: FetchCall) => Response | Promise<Response>) {
  const original = globalThis.fetch;
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input.url;
    const headers = new Headers(init?.headers ?? (typeof input === "object" ? input.headers : undefined));
    const call = { url, headers };
    calls.push(call);
    return await handler(call);
  }) as typeof fetch;
  return {
    calls,
    restore: () => { globalThis.fetch = original; },
  };
}

Deno.test("requireUser: rejects when Authorization header is missing", async () => {
  const mock = withMockedFetch(() => new Response("{}", { status: 200 }));
  try {
    const req = new Request("http://x", { method: "POST" });
    await requireUser(req);
    throw new Error("expected requireUser to throw");
  } catch (err) {
    assert(err instanceof AppError);
    assertEquals((err as AppError).code, "UNAUTHORIZED");
    assertEquals((err as AppError).status, 401);
    assertEquals(mock.calls.length, 0); // never reaches /auth/v1/user
  } finally {
    mock.restore();
  }
});

Deno.test("requireUser: forwards bearer JWT to /auth/v1/user", async () => {
  const mock = withMockedFetch(() => new Response(
    JSON.stringify({ id: "user-123", email: "u@example.com", app_metadata: { role: "admin" } }),
    { status: 200, headers: { "content-type": "application/json" } },
  ));
  try {
    const req = new Request("http://x", {
      method: "POST",
      headers: { authorization: "Bearer user-jwt-token" },
    });
    const user = await requireUser(req);
    assertEquals(user.id, "user-123");
    assertEquals(user.email, "u@example.com");
    assertEquals(user.role, "admin");
    assert(mock.calls.length >= 1);
    const userCall = mock.calls.find((c) => c.url.includes("/auth/v1/user"));
    assert(userCall, "expected a call to /auth/v1/user");
    const auth = userCall!.headers.get("authorization") ?? "";
    assert(auth.includes("Bearer user-jwt-token"), `expected bearer JWT in Authorization, got: ${auth}`);
  } finally {
    mock.restore();
  }
});

Deno.test("requireUser: rejects when /auth/v1/user returns no user", async () => {
  const mock = withMockedFetch(() => new Response(
    JSON.stringify({ msg: "invalid token" }),
    { status: 401, headers: { "content-type": "application/json" } },
  ));
  try {
    const req = new Request("http://x", {
      method: "POST",
      headers: { authorization: "Bearer bad" },
    });
    await requireUser(req);
    throw new Error("expected throw");
  } catch (err) {
    assert(err instanceof AppError);
    assertEquals((err as AppError).code, "UNAUTHORIZED");
  } finally {
    mock.restore();
  }
});
