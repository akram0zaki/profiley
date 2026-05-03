import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '../../contexts/language-context';
import { AccountDeletionCard } from '../account-deletion-card';
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from '../../../lib/legal';

function renderCard(appUserOverrides: Record<string, unknown> = {}, profileOverrides: Record<string, unknown> = {}) {
  const appUser = {
    id: 'user-1',
    email: 'user@example.com',
    preferred_language: 'en',
    browser_locale: 'en-US',
    timezone: 'Europe/Amsterdam',
    onboarding_completed: true,
    role: 'user',
    terms_accepted_at: '2026-05-03T10:00:00.000Z',
    privacy_accepted_at: '2026-05-03T10:00:00.000Z',
    terms_version: CURRENT_TERMS_VERSION,
    privacy_version: CURRENT_PRIVACY_VERSION,
    terms_acceptance_source: 'in_app_gate',
    privacy_acceptance_source: 'in_app_gate',
    deletion_requested_at: null,
    deletion_scheduled_for: null,
    deletion_cancelled_at: null,
    deletion_request_source: null,
    deletion_restore_public_visibility: null,
    ...appUserOverrides,
  };

  const profile = {
    id: 'profile-1',
    user_id: 'user-1',
    slug: 'user',
    full_name: 'User',
    headline: null,
    short_bio: null,
    long_bio: null,
    current_location: null,
    profile_photo_path: null,
    public_visibility: false,
    recruiter_intro: null,
    persona_style: null,
    ...profileOverrides,
  };

  return render(
    <LanguageProvider>
      <AccountDeletionCard appUser={appUser as any} profile={profile as any} reload={async () => undefined} />
    </LanguageProvider>,
  );
}

describe('AccountDeletionCard', () => {
  it('shows the confirmation input when no deletion request is pending', () => {
    renderCard();
    expect(screen.getByLabelText('Type DELETE to confirm')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule account deletion' })).toBeDisabled();
  });

  it('shows the scheduled deletion state and cancel action when a request is pending', () => {
    renderCard(
      {
        deletion_requested_at: '2026-05-03T10:00:00.000Z',
        deletion_scheduled_for: '2026-06-02T10:00:00.000Z',
        deletion_request_source: 'settings',
        deletion_restore_public_visibility: true,
      },
      { public_visibility: false },
    );

    expect(screen.getByText('Deletion request pending')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel deletion request' })).toBeInTheDocument();
  });
});