// Structured logger with correlation id propagation.

const LEVELS = ["trace", "debug", "info", "warn", "error"] as const;
type Level = typeof LEVELS[number];

const minLevel = (Deno.env.get("LOG_LEVEL") ?? "info") as Level;

function shouldLog(level: Level): boolean {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(minLevel);
}

export type Logger = {
  with: (extra: Record<string, unknown>) => Logger;
  trace: (msg: string, extra?: Record<string, unknown>) => void;
  debug: (msg: string, extra?: Record<string, unknown>) => void;
  info: (msg: string, extra?: Record<string, unknown>) => void;
  warn: (msg: string, extra?: Record<string, unknown>) => void;
  error: (msg: string, extra?: Record<string, unknown>) => void;
};

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
    trace: (m, x) => emit("trace", m, { ...extra, ...(x ?? {}) }),
    debug: (m, x) => emit("debug", m, { ...extra, ...(x ?? {}) }),
    info: (m, x) => emit("info", m, { ...extra, ...(x ?? {}) }),
    warn: (m, x) => emit("warn", m, { ...extra, ...(x ?? {}) }),
    error: (m, x) => emit("error", m, { ...extra, ...(x ?? {}) }),
  });
  return make(base);
}

export function loggerForRequest(req: Request, fn: string): Logger {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  return createLogger({ fn, requestId });
}
