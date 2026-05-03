import { z } from "../_shared/validation/schemas.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { handlePreflight } from "../_shared/utils/cors.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

const Body = z.object({
  limit: z.number().int().positive().max(100).optional(),
}).default({});

async function removeStorageArtifacts(userId: string) {
  const supabase = getServiceClient();

  const { data: uploadedDocuments, error: documentsError } = await supabase
    .from("uploaded_documents")
    .select("storage_bucket, storage_path")
    .eq("user_id", userId);
  if (documentsError) throw documentsError;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("profile_photo_path")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError) throw profileError;

  const { data: avatarProfiles, error: avatarError } = await supabase
    .from("avatar_profiles")
    .select("source_photo_path")
    .eq("user_id", userId);
  if (avatarError) throw avatarError;

  const grouped = new Map<string, Set<string>>();

  for (const document of uploadedDocuments ?? []) {
    if (!document.storage_bucket || !document.storage_path) continue;
    if (!grouped.has(document.storage_bucket)) {
      grouped.set(document.storage_bucket, new Set());
    }
    grouped.get(document.storage_bucket)?.add(document.storage_path);
  }

  const avatarPaths = new Set<string>();
  if (profile?.profile_photo_path) avatarPaths.add(profile.profile_photo_path);
  for (const avatarProfile of avatarProfiles ?? []) {
    if (avatarProfile.source_photo_path) avatarPaths.add(avatarProfile.source_photo_path);
  }
  if (avatarPaths.size > 0) {
    grouped.set("avatars", avatarPaths);
  }

  for (const [bucket, paths] of grouped.entries()) {
    const { error } = await supabase.storage.from(bucket).remove([...paths]);
    if (error) throw error;
  }
}

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "process-account-deletions");

  try {
    if (req.method !== "POST") {
      throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    }

    const expected = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    if (!expected || provided !== expected) {
      throw new AppError("UNAUTHORIZED_CRON", "Invalid cron secret", 401);
    }

    const body = Body.parse(await req.json().catch(() => ({})));
    const supabase = getServiceClient();
    const nowIso = new Date().toISOString();
    const limit = body.limit ?? 20;

    const { data: dueUsers, error: dueUsersError } = await supabase
      .from("app_users")
      .select("id")
      .not("deletion_scheduled_for", "is", null)
      .is("deletion_cancelled_at", null)
      .lte("deletion_scheduled_for", nowIso)
      .order("deletion_scheduled_for", { ascending: true })
      .limit(limit);

    if (dueUsersError) throw dueUsersError;

    let deleted = 0;
    const failures: Array<{ userId: string; message: string }> = [];

    for (const account of dueUsers ?? []) {
      try {
        await removeStorageArtifacts(account.id);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(account.id);
        if (deleteError) throw deleteError;
        deleted += 1;
      } catch (error) {
        failures.push({
          userId: account.id,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    log.info("processed", { deleted, failed: failures.length });
    return respond(req, { deleted, failed: failures.length, failures });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});