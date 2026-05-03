import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from '../../contexts/language-context';
import LegalAcceptancePage from '../legal-acceptance';
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from '../../../lib/legal';

const acceptLegalDocumentsMock = vi.fn();
const reloadMock = vi.fn();
const navigateMock = vi.fn();
const useCurrentProfileMock = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../lib/api', async () => {
  const actual = await vi.importActual('../../../lib/api');
  return {
    ...actual,
    api: {
      acceptLegalDocuments: (...args: unknown[]) => acceptLegalDocumentsMock(...args),
    },
  };
});

vi.mock('../../../lib/profile', () => ({
  useCurrentProfile: () => useCurrentProfileMock(),
}));

function makeAppUser(overrides: Record<string, unknown> = {}) {
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

function renderPage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <LegalAcceptancePage />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe('LegalAcceptancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acceptLegalDocumentsMock.mockResolvedValue({});
    reloadMock.mockResolvedValue(undefined);
  });

  it('only asks for the terms acknowledgement when only the terms version is stale', async () => {
    useCurrentProfileMock.mockReturnValue({
      appUser: makeAppUser({ terms_version: '2026-04-27' }),
      loading: false,
      reload: reloadMock,
    });

    renderPage();

    expect(screen.getByLabelText(/terms & conditions/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/privacy policy/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  });

  it('submits after acknowledging the only stale document', async () => {
    useCurrentProfileMock.mockReturnValue({
      appUser: makeAppUser({ terms_version: '2026-04-27' }),
      loading: false,
      reload: reloadMock,
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText(/terms & conditions/i));
    await user.click(screen.getByRole('button', { name: /accept and continue/i }));

    await waitFor(() => {
      expect(acceptLegalDocumentsMock).toHaveBeenCalledWith({
        termsAccepted: true,
        privacyAccepted: true,
        acceptanceSource: 'in_app_gate',
      });
    });
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});