import { getServiceClient } from "../db/serviceClient.ts";

export type RecruiterEvent = {
  profileId: string;
  eventName: string;
  payload?: Record<string, unknown>;
  visitorSessionId?: string | null;
  ipHash?: string | null;
};

export async function trackEvent(e: RecruiterEvent): Promise<void> {
  try {
    await getServiceClient().from("recruiter_events").insert({
      profile_id: e.profileId,
      event_name: e.eventName,
      event_payload: e.payload ?? {},
      visitor_session_id: e.visitorSessionId ?? null,
    });
  } catch {
    // Analytics failures must never block the request.
  }
}
