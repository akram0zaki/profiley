import legalVersions from "../../../shared/legal-versions.json" with { type: "json" };

export const CURRENT_TERMS_VERSION = legalVersions.termsVersion;
export const CURRENT_PRIVACY_VERSION = legalVersions.privacyVersion;

export type LegalAcceptanceSource = "in_app_gate";

export type AppUserLegalState = {
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  terms_version: string | null;
  privacy_version: string | null;
  terms_acceptance_source: string | null;
  privacy_acceptance_source: string | null;
};

export function hasAcceptedCurrentLegalVersions(
  state: Pick<AppUserLegalState, "terms_accepted_at" | "privacy_accepted_at" | "terms_version" | "privacy_version">,
): boolean {
  return Boolean(
    state.terms_accepted_at &&
      state.privacy_accepted_at &&
      state.terms_version === CURRENT_TERMS_VERSION &&
      state.privacy_version === CURRENT_PRIVACY_VERSION,
  );
}

export function buildLegalAcceptancePatch(
  state: AppUserLegalState,
  nowIso: string,
  source: LegalAcceptanceSource,
): Partial<AppUserLegalState> {
  const patch: Partial<AppUserLegalState> = {};

  if (state.terms_version !== CURRENT_TERMS_VERSION || !state.terms_accepted_at) {
    patch.terms_version = CURRENT_TERMS_VERSION;
    patch.terms_accepted_at = nowIso;
    patch.terms_acceptance_source = source;
  }

  if (state.privacy_version !== CURRENT_PRIVACY_VERSION || !state.privacy_accepted_at) {
    patch.privacy_version = CURRENT_PRIVACY_VERSION;
    patch.privacy_accepted_at = nowIso;
    patch.privacy_acceptance_source = source;
  }

  return patch;
}