import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import SettingsAIPage from '../settings-ai';

const useAuthMock = vi.fn();
const useCurrentProfileMock = vi.fn();
const updatePreferencesMock = vi.fn();

function createConfigsQuery() {
  return {
    order: vi.fn((column: string) => {
      if (column === 'capability') {
        return createConfigsQuery();
      }

      return Promise.resolve({ data: [] });
    }),
  };
}

const fromMock = vi.fn((table: string) => {
  if (table === 'ai_provider_configs') {
    return {
      select: () => ({
        eq: () => ({
          order: () => createConfigsQuery(),
        }),
      }),
    };
  }

  if (table === 'feature_model_assignments') {
    return {
      select: () => Promise.resolve({ data: [] }),
    };
  }

  return {
    select: () => Promise.resolve({ data: [] }),
  };
});

vi.mock('../../components/app-layout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../lib/auth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../lib/profile', () => ({
  useCurrentProfile: () => useCurrentProfileMock(),
  updatePreferences: (...args: unknown[]) => updatePreferencesMock(...args),
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock('../../contexts/language-context', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SettingsAIPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCurrentProfileMock.mockReturnValue({
      appUser: { id: 'user-1' },
      preferences: { ai_persona_tone: 'professional' },
      loading: false,
      reload: vi.fn(),
    });
  });

  it('hides Custom System Prompt and Active Models for non-admin users', () => {
    useAuthMock.mockReturnValue({ loading: false, role: 'user' });

    render(
      <MemoryRouter>
        <SettingsAIPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('settingsAi.customPrompt.title')).not.toBeInTheDocument();
    expect(screen.queryByText('settingsAi.activeModels.title')).not.toBeInTheDocument();
    expect(screen.getByText('settingsAi.assignments.title')).toBeInTheDocument();
  });

  it('shows Custom System Prompt and Active Models for admin users', () => {
    useAuthMock.mockReturnValue({ loading: false, role: 'admin' });

    render(
      <MemoryRouter>
        <SettingsAIPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('settingsAi.customPrompt.title')).toBeInTheDocument();
    expect(screen.getByText('settingsAi.activeModels.title')).toBeInTheDocument();
  });
});