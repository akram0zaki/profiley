// Standardized response envelopes and error type.

import { corsHeaders } from "./cors.ts";

export type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
  meta?: Record<string, unknown>;
};

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function respond<T>(
  req: Request,
  data: T,
  init: { status?: number; meta?: Record<string, unknown> } = {},
): Response {
  const body: Envelope<T> = {
    success: true,
    data,
    error: null,
    ...(init.meta ? { meta: init.meta } : {}),
  };
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export function respondError(
  req: Request,
  err: unknown,
  fallbackStatus = 500,
): Response {
  let status = fallbackStatus;
  let code = "INTERNAL_ERROR";
  let message = "Unexpected error";
  let details: unknown = undefined;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof Error) {
    message = err.message;
  }

  const body: Envelope<null> = {
    success: false,
    data: null,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
