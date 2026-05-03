import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { render, screen } from '@testing-library/react';
import {
  RequireAppAccess,
  RequireLegalAcceptance,
} from '../auth-guards';
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from '../../../lib/legal';

const useAuthMock = vi.fn();
const useCurrentProfileMock = vi.fn();

vi.mock('../../../lib/auth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../lib/profile', () => ({
  useCurrentProfile: () => useCurrentProfileMock(),
}));

function acceptedAppUser(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

function renderWithRoutes(initialPath: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dashboard" element={element} />
        <Route path="/onboarding" element={<div>Onboarding route</div>} />
        <Route path="/legal/acceptance" element={<div>Legal acceptance route</div>} />
        <Route path="/login" element={<div>Login route</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('auth guards', () => {
  it('redirects protected routes to the legal acceptance screen when acceptance is missing', () => {
    useAuthMock.mockReturnValue({ loading: false, session: { access_token: 'jwt' }, role: 'user' });
    useCurrentProfileMock.mockReturnValue({
      appUser: acceptedAppUser({ terms_version: null, terms_accepted_at: null }),
      loading: false,
    });

    renderWithRoutes(
      '/dashboard',
      <RequireAppAccess>
        <div>Protected content</div>
      </RequireAppAccess>,
    );

    expect(screen.getByText('Legal acceptance route')).toBeInTheDocument();
  });

  it('redirects accepted but non-onboarded users to onboarding', () => {
    useAuthMock.mockReturnValue({ loading: false, session: { access_token: 'jwt' }, role: 'user' });
    useCurrentProfileMock.mockReturnValue({
      appUser: acceptedAppUser({ onboarding_completed: false }),
      loading: false,
    });

    renderWithRoutes(
      '/dashboard',
      <RequireAppAccess>
        <div>Protected content</div>
      </RequireAppAccess>,
    );

    expect(screen.getByText('Onboarding route')).toBeInTheDocument();
  });

  it('allows accepted and onboarded users through the protected gate', () => {
    useAuthMock.mockReturnValue({ loading: false, session: { access_token: 'jwt' }, role: 'user' });
    useCurrentProfileMock.mockReturnValue({
      appUser: acceptedAppUser(),
      loading: false,
    });

    renderWithRoutes(
      '/dashboard',
      <RequireAppAccess>
        <div>Protected content</div>
      </RequireAppAccess>,
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('blocks onboarding until the current legal versions are accepted', () => {
    useAuthMock.mockReturnValue({ loading: false, session: { access_token: 'jwt' }, role: 'user' });
    useCurrentProfileMock.mockReturnValue({
      appUser: acceptedAppUser({ privacy_version: '2026-04-27' }),
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <RequireLegalAcceptance>
                <div>Onboarding shell</div>
              </RequireLegalAcceptance>
            }
          />
          <Route path="/legal/acceptance" element={<div>Legal acceptance route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Legal acceptance route')).toBeInTheDocument();
  });
});