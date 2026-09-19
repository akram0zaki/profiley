import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import OnboardingPage from '../onboarding';

const navigateMock = vi.fn();
const initializeUserProfileMock = vi.fn();
const completeActivationMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

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
      completeActivation: (...args: unknown[]) => completeActivationMock(...args),
    },
    ApiError: actual.ApiError,
  };
});

vi.mock('../../../lib/document-upload', () => ({
  validateDocumentFile: () => null,
  uploadUserDocument: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <OnboardingPage />
    </MemoryRouter>,
  );
}

describe('OnboardingPage quick start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initializeUserProfileMock.mockResolvedValue({});
    completeActivationMock.mockResolvedValue({ activationCompletedAt: '2026-05-12T00:00:00.000Z' });
  });

  it('completes activation when the user skips quick start', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'onboarding.actions.skip' }));

    await waitFor(() => {
      expect(completeActivationMock).toHaveBeenCalledWith({ completionSource: 'skip' });
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('renders the primary quick-start actions', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'onboarding.actions.uploadCv' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'onboarding.actions.skip' })).toBeInTheDocument();
  });
});