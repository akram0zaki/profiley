import { z } from "https://esm.sh/zod@3.23.8";
import { AppError } from "../utils/errors.ts";

export async function parseJsonBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError("INVALID_JSON", "Request body must be valid JSON", 400);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid request payload", 400, result.error.flatten());
  }
  return result.data;
}
