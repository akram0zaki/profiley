import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  buildDeletionCancellationUpdate,
  buildDeletionRequestUpdate,
  calculateDeletionScheduledFor,
  hasPendingDeletion,
  isDeletionDue,
} from "../functions/_shared/accountDeletion.ts";

Deno.test("calculateDeletionScheduledFor: schedules deletion 30 days out", () => {
  const requestedAt = "2026-05-03T10:00:00.000Z";
  assertEquals(
    calculateDeletionScheduledFor(requestedAt),
    "2026-06-02T10:00:00.000Z",
  );
  assertEquals(ACCOUNT_DELETION_GRACE_DAYS, 30);
});

Deno.test("buildDeletionRequestUpdate: stores schedule and visibility restore flag", () => {
  const update = buildDeletionRequestUpdate("2026-05-03T10:00:00.000Z", "settings", true);
  assertEquals(update.deletion_request_source, "settings");
  assertEquals(update.deletion_restore_public_visibility, true);
  assertEquals(update.deletion_cancelled_at, null);
  assertEquals(update.deletion_scheduled_for, "2026-06-02T10:00:00.000Z");
});

Deno.test("buildDeletionCancellationUpdate: clears pending deletion state", () => {
  const update = buildDeletionCancellationUpdate("2026-05-10T12:00:00.000Z");
  assertEquals(update.deletion_requested_at, null);
  assertEquals(update.deletion_scheduled_for, null);
  assertEquals(update.deletion_request_source, null);
  assertEquals(update.deletion_restore_public_visibility, null);
  assertEquals(update.deletion_cancelled_at, "2026-05-10T12:00:00.000Z");
});

Deno.test("pending and due helpers: distinguish recoverable vs due deletions", () => {
  const pendingState = {
    deletion_requested_at: "2026-05-03T10:00:00.000Z",
    deletion_scheduled_for: "2026-06-02T10:00:00.000Z",
    deletion_cancelled_at: null,
    deletion_request_source: "settings",
    deletion_restore_public_visibility: true,
  };

  assertEquals(hasPendingDeletion(pendingState), true);
  assertEquals(isDeletionDue(pendingState, "2026-05-20T10:00:00.000Z"), false);
  assertEquals(isDeletionDue(pendingState, "2026-06-02T10:00:00.000Z"), true);
});