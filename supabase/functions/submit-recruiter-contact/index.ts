// Recruiter contact form: hCaptcha verification, rate limiting, Resend email delivery.

import { handlePreflight } from "../_shared/utils/cors.ts";
import { respond, respondError, AppError } from "../_shared/utils/errors.ts";
import { getServiceClient } from "../_shared/db/serviceClient.ts";
import { parseJsonBody } from "../_shared/validation/parse.ts";
import { SubmitRecruiterContactSchema } from "../_shared/validation/schemas.ts";
import { rateLimit, visitorSessionFromHeader, clientIp, hashIp } from "../_shared/utils/rateLimit.ts";
import { loggerForRequest } from "../_shared/utils/logger.ts";

async function verifyHCaptcha(token: string, ip?: string): Promise<boolean> {
  const secret = Deno.env.get("HCAPTCHA_SECRET");
  if (!secret) return true; // skip verification when not configured (dev)
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  const res = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    body: form,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!res.ok) return false;
  const json = await res.json();
  return !!json.success;
}

async function sendViaResend(opts: {
  to: string;
  fromName: string;
  fromEmail: string;
  visitorName: string;
  visitorEmail: string;
  company?: string;
  message: string;
  profileSlug: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };
  const subject = `New message from ${opts.visitorName} via Profiley`;
  const html = `
    <p><strong>From:</strong> ${escape(opts.visitorName)} &lt;${escape(opts.visitorEmail)}&gt;</p>
    ${opts.company ? `<p><strong>Company:</strong> ${escape(opts.company)}</p>` : ""}
    <p><strong>Profile:</strong> /public/${escape(opts.profileSlug)}</p>
    <hr/>
    <pre style="white-space:pre-wrap;font-family:inherit">${escape(opts.message)}</pre>
  `;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${opts.fromName} <${opts.fromEmail}>`,
      to: [opts.to],
      reply_to: opts.visitorEmail,
      subject,
      html,
    }),
  });
  if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
  return { ok: true };
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]!
  );
}

Deno.serve(async (req) => {
  const pf = handlePreflight(req);
  if (pf) return pf;
  const log = loggerForRequest(req, "submit-recruiter-contact");
  try {
    if (req.method !== "POST") throw new AppError("METHOD_NOT_ALLOWED", "POST required", 405);
    const body = await parseJsonBody(req, SubmitRecruiterContactSchema);
    const supabase = getServiceClient();

    const { data: profile } = await supabase
      .from("public_profile_view")
      .select("id, full_name, allow_contact_form, user_id")
      .eq("slug", body.slug)
      .maybeSingle();
    if (!profile) throw new AppError("PROFILE_NOT_FOUND", "Profile not found", 404);
    if (!profile.allow_contact_form) throw new AppError("CONTACT_DISABLED", "Owner disabled contact form", 403);

    const session = body.visitorSessionId ?? visitorSessionFromHeader(req);
    const ip = clientIp(req) ?? "unknown";
    const ipH = hashIp(ip);
    await rateLimit({ key: `contact:session:${profile.id}:${session}`, windowSeconds: 86400, max: 3 });
    await rateLimit({ key: `contact:ip:${profile.id}:${ipH}`, windowSeconds: 86400, max: 5 });

    if (body.captchaToken) {
      const ok = await verifyHCaptcha(body.captchaToken, ip);
      if (!ok) throw new AppError("CAPTCHA_FAILED", "Captcha verification failed", 400);
    } else if (Deno.env.get("HCAPTCHA_SECRET")) {
      throw new AppError("CAPTCHA_REQUIRED", "Captcha token required", 400);
    }

    // Insert pending row.
    const { data: row, error: insErr } = await supabase.from("recruiter_contacts").insert({
      profile_id: profile.id,
      visitor_name: body.visitorName,
      visitor_email: body.visitorEmail,
      company: body.company,
      message: body.message,
      delivery_status: "pending",
      ip_hash: ipH,
      visitor_session_id: session,
    }).select("id").single();
    if (insErr) throw insErr;

    // Find owner email.
    const { data: owner } = await supabase
      .from("app_users")
      .select("email")
      .eq("id", profile.user_id)
      .maybeSingle();
    const ownerEmail = owner?.email ?? null;

    let deliveryStatus: "sent" | "failed" = "failed";
    let deliveryError: string | null = "owner email missing";
    if (ownerEmail) {
      const fromName = Deno.env.get("RECRUITER_EMAIL_FROM_NAME") ?? "Profiley";
      const fromEmail = Deno.env.get("RECRUITER_EMAIL_FROM") ?? "noreply@profiley.app";
      const r = await sendViaResend({
        to: ownerEmail,
        fromName,
        fromEmail,
        visitorName: body.visitorName,
        visitorEmail: body.visitorEmail,
        company: body.company,
        message: body.message,
        profileSlug: body.slug,
      });
      deliveryStatus = r.ok ? "sent" : "failed";
      deliveryError = r.ok ? null : r.error ?? "send failed";
    }

    await supabase.from("recruiter_contacts").update({
      delivery_status: deliveryStatus,
      delivery_error: deliveryError,
    }).eq("id", row.id);

    return respond(req, { ok: deliveryStatus === "sent", contactId: row.id, deliveryStatus });
  } catch (err) {
    log.error("failed", err);
    return respondError(req, err);
  }
});
