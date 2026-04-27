// Shared CORS helper for Profiley edge functions.

const DEFAULT_ALLOWED = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function parseAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length > 0 ? list : DEFAULT_ALLOWED;
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = parseAllowedOrigins();
  return allowed.some((entry) => {
    if (entry === origin) return true;
    if (entry.includes("*")) {
      const re = new RegExp(
        "^" + entry.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
      );
      return re.test(origin);
    }
    return false;
  });
}

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin");
  const allowOrigin = isOriginAllowed(origin) ? origin! : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-request-id, x-cron-secret, x-visitor-session",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function handlePreflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
