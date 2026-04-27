// Auth helpers: extract the authenticated user from a request.

import { AppError } from "../utils/errors.ts";

export type AuthedUser = {
  id: string;
  email: string | null;
  role: string;
};

function bearerToken(req: Request): string {
  const authHeader = req.headers.get("authorization") ?? "";
  return authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
}

export async function requireUser(req: Request): Promise<AuthedUser> {
  const token = bearerToken(req);
  if (!token) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set");
  }

  // Hit the GoTrue /auth/v1/user endpoint directly. We avoid supabase-js's
  // auth client here because (a) it ignores `global.headers.authorization`
  // (it manages its own session header) and (b) the new `sb_publishable_*`
  // API key format has shown intermittent issues going through the SDK.
  // Both `apikey` and the user JWT must be sent.
  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (_err) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  if (!res.ok) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  let user: {
    id?: string;
    email?: string | null;
    app_metadata?: { role?: string };
  };
  try {
    user = await res.json();
  } catch {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  if (!user?.id) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const role = user.app_metadata?.role ?? "user";
  return { id: user.id, email: user.email ?? null, role };
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
