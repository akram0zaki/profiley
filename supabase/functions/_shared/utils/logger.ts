// Structured logger with correlation id propagation.

const LEVELS = ["trace", "debug", "info", "warn", "error"] as const;
type Level = typeof LEVELS[number];

const minLevel = (Deno.env.get("LOG_LEVEL") ?? "info") as Level;

function shouldLog(level: Level): boolean {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(minLevel);
}

// Call sites log caught errors directly (`log.error("failed", err)`), where
// `err` is `unknown`, so the extra is normalized rather than typed narrowly.
export type Logger = {
  with: (extra: Record<string, unknown>) => Logger;
  trace: (msg: string, extra?: unknown) => void;
  debug: (msg: string, extra?: unknown) => void;
  info: (msg: string, extra?: unknown) => void;
  warn: (msg: string, extra?: unknown) => void;
  error: (msg: string, extra?: unknown) => void;
};

function toContext(extra: unknown): Record<string, unknown> {
  if (extra === undefined || extra === null) return {};
  if (extra instanceof Error) {
    // Error's own properties are non-enumerable, so spreading loses them.
    return { error: extra.message, stack: extra.stack };
  }
  if (typeof extra === "object" && !Array.isArray(extra)) {
    return extra as Record<string, unknown>;
  }
  return { error: String(extra) };
}

function emit(level: Level, msg: string, ctx: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...ctx,
  });
  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function createLogger(base: Record<string, unknown> = {}): Logger {
  const make = (extra: Record<string, unknown>): Logger => ({
    with: (more) => make({ ...extra, ...more }),
    trace: (m, x) => emit("trace", m, { ...extra, ...toContext(x) }),
    debug: (m, x) => emit("debug", m, { ...extra, ...toContext(x) }),
    info: (m, x) => emit("info", m, { ...extra, ...toContext(x) }),
    warn: (m, x) => emit("warn", m, { ...extra, ...toContext(x) }),
    error: (m, x) => emit("error", m, { ...extra, ...toContext(x) }),
  });
  return make(base);
}

export function loggerForRequest(req: Request, fn: string): Logger {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  return createLogger({ fn, requestId });
}
