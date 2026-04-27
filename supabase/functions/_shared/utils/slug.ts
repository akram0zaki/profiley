// Slug generation helper.

import { getServiceClient } from "../db/serviceClient.ts";

/** Normalize a free-form name into a URL-safe profile slug fragment. */
export function baseSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "user";
}

export async function generateUniqueSlug(fullName: string): Promise<string> {
  const supabase = getServiceClient();
  const base = baseSlug(fullName);
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}
