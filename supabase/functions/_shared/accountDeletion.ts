export const ACCOUNT_DELETION_GRACE_DAYS = 30;

export type AccountDeletionState = {
  deletion_requested_at: string | null;
  deletion_scheduled_for: string | null;
  deletion_cancelled_at: string | null;
  deletion_request_source: string | null;
  deletion_restore_public_visibility: boolean | null;
};

export function calculateDeletionScheduledFor(requestedAtIso: string): string {
  const requestedAt = new Date(requestedAtIso);
  requestedAt.setUTCDate(requestedAt.getUTCDate() + ACCOUNT_DELETION_GRACE_DAYS);
  return requestedAt.toISOString();
}

export function hasPendingDeletion(state: AccountDeletionState): boolean {
  return Boolean(state.deletion_scheduled_for && !state.deletion_cancelled_at);
}

export function isDeletionDue(state: AccountDeletionState, nowIso: string): boolean {
  if (!state.deletion_scheduled_for || state.deletion_cancelled_at) return false;
  return new Date(state.deletion_scheduled_for).getTime() <= new Date(nowIso).getTime();
}

export function buildDeletionRequestUpdate(
  requestedAtIso: string,
  requestSource: string,
  restorePublicVisibility: boolean,
): AccountDeletionState {
  return {
    deletion_requested_at: requestedAtIso,
    deletion_scheduled_for: calculateDeletionScheduledFor(requestedAtIso),
    deletion_cancelled_at: null,
    deletion_request_source: requestSource,
    deletion_restore_public_visibility: restorePublicVisibility,
  };
}

export function buildDeletionCancellationUpdate(nowIso: string): AccountDeletionState {
  return {
    deletion_requested_at: null,
    deletion_scheduled_for: null,
    deletion_cancelled_at: nowIso,
    deletion_request_source: null,
    deletion_restore_public_visibility: null,
  };
}