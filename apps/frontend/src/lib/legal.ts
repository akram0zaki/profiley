import legalVersions from '../../../../shared/legal-versions.json';

export const CURRENT_TERMS_VERSION = legalVersions.termsVersion;
export const CURRENT_PRIVACY_VERSION = legalVersions.privacyVersion;

export type LegalAcceptanceState = {
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  terms_version: string | null;
  privacy_version: string | null;
};

export function hasAcceptedCurrentLegalVersions(
  state: LegalAcceptanceState | null | undefined,
): boolean {
  return Boolean(
    state?.terms_accepted_at &&
      state?.privacy_accepted_at &&
      state?.terms_version === CURRENT_TERMS_VERSION &&
      state?.privacy_version === CURRENT_PRIVACY_VERSION,
  );
}