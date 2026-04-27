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
  const { data, error } = await supabase.auth.getUser();
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
