import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from '../../contexts/language-context';
import DashboardPage from '../dashboard';

vi.mock('../../components/app-layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../lib/profile', () => ({
  useCurrentProfile: () => ({
    appUser: { id: 'user-1', email: 'user@example.com' },
    profile: { id: 'profile-1', full_name: 'Test User', public_visibility: false },
    loading: false,
  }),
}));

vi.mock('../../../lib/cv-readiness', () => ({
  useProcessedCvReadiness: () => ({ hasProcessedCv: false, loading: false }),
}));

vi.mock('../../../lib/supabase', () => {
  const makeQuery = (result = { count: 0, data: [] as unknown[] }) => {
    const builder: Record<string, unknown> = {
      select: () => builder,
      eq: () => builder,
      is: () => builder,
      order: () => builder,
      limit: () => builder,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    };
    return builder;
  };

  return {
    supabase: {
      from: () => makeQuery(),
    },
  };
});

describe('DashboardPage quick-start actions', () => {
  it('shows quick-start re-entry and processed CV readiness messaging', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <DashboardPage />
        </LanguageProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Upload and process a CV to unlock AI tools')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Open Quick Start' })).toHaveLength(2);
  });
});