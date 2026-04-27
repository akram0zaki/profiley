// Sliding-window rate limiter backed by Postgres.

import { getServiceClient } from "../db/serviceClient.ts";
import { AppError } from "./errors.ts";

export type RateLimitOptions = {
  key: string;
  windowSeconds: number;
  max: number;
  /** Throws AppError when exceeded; otherwise returns remaining count. */
  throwOnExceed?: boolean;
};

/** Increment the counter for the current window and return remaining quota. */
export async function rateLimit(opts: RateLimitOptions): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}> {
  const supabase = getServiceClient();
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (opts.windowSeconds * 1000)) *
      (opts.windowSeconds * 1000),
  );

  // Atomic upsert + increment via RPC pattern.
  const { data, error } = await supabase.rpc("rate_limit_increment", {
    p_bucket_key: opts.key,
    p_window_start: windowStart.toISOString(),
  }).maybeSingle();

  // Fallback if the RPC isn't available: use direct table writes.
  if (error || !data) {
    const { data: row } = await supabase
      .from("rate_limit_buckets")
      .select("count")
      .eq("bucket_key", opts.key)
      .eq("window_start", windowStart.toISOString())
      .maybeSingle();

    const currentCount = (row?.count ?? 0) + 1;
    await supabase.from("rate_limit_buckets").upsert(
      {
        bucket_key: opts.key,
        window_start: windowStart.toISOString(),
        count: currentCount,
      },
      { onConflict: "bucket_key,window_start" },
    );
    const remaining = Math.max(0, opts.max - currentCount);
    const allowed = currentCount <= opts.max;
    if (!allowed && opts.throwOnExceed) {
      throw new AppError("RATE_LIMITED", "Rate limit exceeded", 429);
    }
    return {
      allowed,
      remaining,
      retryAfterSec: allowed ? 0 : opts.windowSeconds,
    };
  }

  const count = (data as { new_count?: number }).new_count ?? 0;
  const remaining = Math.max(0, opts.max - count);
  const allowed = count <= opts.max;
  if (!allowed && opts.throwOnExceed) {
    throw new AppError("RATE_LIMITED", "Rate limit exceeded", 429);
  }
  return { allowed, remaining, retryAfterSec: allowed ? 0 : opts.windowSeconds };
}

/** Generate (or read) a signed visitor session id for anonymous users. */
export async function visitorSessionFromHeader(
  req: Request,
): Promise<string> {
  const fromHeader = req.headers.get("x-visitor-session");
  if (fromHeader && fromHeader.length >= 16 && fromHeader.length <= 128) {
    return fromHeader;
  }
  return crypto.randomUUID();
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function hashIp(ip: string): Promise<string> {
  const secret = Deno.env.get("VISITOR_SESSION_HMAC_SECRET") ?? "profiley-dev";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(ip));
  return Array.from(new Uint8Array(sig))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
