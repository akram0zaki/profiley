import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from '../../contexts/language-context';
import JobFitPreviewPage from '../job-fit-preview';

vi.mock('../../components/app-layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../lib/profile', () => ({
  useCurrentProfile: () => ({ profile: { slug: 'test-user' }, loading: false }),
}));

vi.mock('../../../lib/api', () => ({
  api: {
    analyzeJobFit: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

describe('JobFitPreviewPage AI notice', () => {
  it('shows the AI notice and support links before the first analysis', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <JobFitPreviewPage />
        </LanguageProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('AI-generated assistance')).toBeInTheDocument();
    expect(
      screen.getByText(/should not be used as an automated hiring or employment decision/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy details' })).toHaveAttribute('href', '/legal/privacy');
    expect(screen.getByRole('link', { name: 'Raise a concern' })).toHaveAttribute(
      'href',
      'mailto:privacy@profiley.ai',
    );
  });
});