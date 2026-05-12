import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { LanguageProvider } from '../../contexts/language-context';
import PublicProfilePage from '../public-profile';

const getPublicProfileMock = vi.fn();
const trackRecruiterEventMock = vi.fn().mockResolvedValue(undefined);

const knowledgeChunksQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [] }),
};

vi.mock('../../../lib/api', () => ({
  api: {
    getPublicProfile: (...args: unknown[]) => getPublicProfileMock(...args),
    trackRecruiterEvent: (...args: unknown[]) => trackRecruiterEventMock(...args),
  },
  ApiError: class ApiError extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => knowledgeChunksQuery),
  },
}));

const chatInterfaceMock = vi.fn(({ profileName }: { profileName?: string }) => (
  <div>Chat interface mock for {profileName ?? 'unknown'}</div>
));

vi.mock('../../components/chat-interface', () => ({
  ChatInterface: (props: { profileName?: string }) => chatInterfaceMock(props),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/public/test-user']}>
      <LanguageProvider>
        <Routes>
          <Route path="/public/:username" element={<PublicProfilePage />} />
        </Routes>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe('PublicProfilePage AI disclosures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPublicProfileMock.mockResolvedValue({
      id: 'profile-1',
      user_id: 'user-1',
      slug: 'test-user',
      full_name: 'Test User',
      headline: 'AI Engineer',
      short_bio: 'Short bio',
      long_bio: 'Long bio',
      current_location: 'Amsterdam',
      social_links: {
        linkedin: 'https://www.linkedin.com/in/test-user',
        discord: 'test-user#1234',
      },
      profile_photo_path: null,
      photoUrl: null,
      allow_public_chat: true,
      allow_job_fit_analysis: true,
      allow_contact_form: false,
    });
  });

  it('shows recruiter-facing chat and job-fit transparency notices at the point of use', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    expect(screen.getByText('Profiles & Links')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'in/test-user' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/test-user',
    );
    expect(screen.getByText('test-user#1234')).toBeInTheDocument();

    expect(screen.getByText('AI-Assisted Profile')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'AI Chat' }));
    await waitFor(() => {
      expect(screen.getByText('AI-generated answers')).toBeInTheDocument();
    });
    expect(screen.getByText('Chat interface mock for Test User')).toBeInTheDocument();
    expect(
      screen.getByText(/verify important claims with the candidate directly/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Job Fit' }));
    await waitFor(() => {
      expect(screen.getByText('Assistive analysis only')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/not an automated hiring decision/i),
    ).toBeInTheDocument();
  });
});