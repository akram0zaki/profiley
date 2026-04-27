// Avatar foundation stub (post-MVP). Returns 501 unless ENABLE_AVATAR_FOUNDATION=true.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { requireUser } from "../_shared/auth/requireUser.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { CreateAvatarProfileSchema } from "../_shared/validation/schemas.ts";

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  try {
    if (Deno.env.get("ENABLE_AVATAR_FOUNDATION") !== "true") {
      throw new AppError("NOT_IMPLEMENTED", "Avatar foundation is not enabled", 501);
    }
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const user = await requireUser(req);
    const body = await parseJsonBody(req, CreateAvatarProfileSchema);
    const supabase = getServiceClient();
    const { data, error } = await supabase.from("avatar_profiles").upsert({
      user_id: user.id,
      source_photo_path: body.sourcePhotoPath,
      voice_provider: body.voiceProvider,
      voice_model: body.voiceModel,
      status: "pending_review",
    }, { onConflict: "user_id" } as any).select("*").single();
    if (error) throw error;
    return respond(req, data);
  } catch (err) {
    return respondError(req, err);
  }
});
