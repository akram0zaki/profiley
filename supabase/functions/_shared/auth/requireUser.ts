// Auth helpers: extract the authenticated user from a request.

import { AppError } from "../utils/errors.ts";
import { getUserClient } from "../db/userClient.ts";

export type AuthedUser = {
  id: string;
  email: string | null;
  role: string;
};

export async function requireUser(req: Request): Promise<AuthedUser> {
  const supabase = getUserClient(req);
  // Pass the JWT explicitly: supabase-js's auth client manages its own
  // Authorization header and does not consult the `global.headers` value we
  // set in `getUserClient`, so calling `getUser()` without an argument hits
  // /auth/v1/user with the anon key only and returns no user.
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }
  const role = (data.user.app_metadata?.role as string | undefined) ?? "user";
  return { id: data.user.id, email: data.user.email ?? null, role };
}

export async function requireAdmin(req: Request): Promise<AuthedUser> {
  const user = await requireUser(req);
  if (user.role !== "admin") {
    throw new AppError("FORBIDDEN", "Admin role required", 403);
  }
  return user;
}

export async function optionalUser(req: Request): Promise<AuthedUser | null> {
  try {
    return await requireUser(req);
  } catch {
    return null;
  }
}
