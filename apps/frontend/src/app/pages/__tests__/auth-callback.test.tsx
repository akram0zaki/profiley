import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AuthCallbackPage from '../auth-callback';
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from '../../../lib/legal';

const navigateMock = vi.fn();
const initializeUserProfileMock = vi.fn();
const getSessionMock = vi.fn();
const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../contexts/language-context', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock('../../hooks/use-document-title', () => ({
  useDocumentTitle: () => undefined,
}));

vi.mock('../../../lib/api', async () => {
  const actual = await vi.importActual('../../../lib/api');
  return {
    ...actual,
    api: {
      initializeUserProfile: (...args: unknown[]) => initializeUserProfileMock(...args),
    },
  };
});

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => getSessionMock(),
    },
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

function renderPage(search = '') {
  window.history.pushState({}, '', `/auth/callback${search}`);
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <AuthCallbackPage />
    </MemoryRouter>,
  );
}

function makeAppUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    preferred_language: 'en',
    browser_locale: 'en-US',
    timezone: 'Europe/Amsterdam',
    activation_completed_at: '2026-05-03T10:00:00.000Z',
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

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initializeUserProfileMock.mockResolvedValue({});
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1' },
        },
      },
    });
    maybeSingleMock.mockResolvedValue({ data: makeAppUser(), error: null });
  });

  it('routes first-run users to quick start when activation is incomplete', async () => {
    maybeSingleMock.mockResolvedValue({
      data: makeAppUser({ activation_completed_at: null, onboarding_completed: false }),
      error: null,
    });

    renderPage();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/onboarding', { replace: true });
    });
  });

  it('routes returning users to the requested redirect target', async () => {
    renderPage('?redirect=%2Fprofile');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/profile', { replace: true });
    });
  });

  it('routes users with stale legal acceptance to the acceptance gate before quick start', async () => {
    maybeSingleMock.mockResolvedValue({
      data: makeAppUser({
        activation_completed_at: null,
        terms_accepted_at: null,
        terms_version: null,
      }),
      error: null,
    });

    renderPage();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/legal/acceptance?redirect=%2Fonboarding', { replace: true });
    });
  });
});