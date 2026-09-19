import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from '../../contexts/language-context';
import ChatPreviewPage from '../chat-preview';

vi.mock('../../components/app-layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../components/chat-interface', () => ({
  ChatInterface: () => <div>Chat interface</div>,
}));

vi.mock('../../../lib/profile', () => ({
  useCurrentProfile: () => ({ profile: { full_name: 'Test User', slug: 'test-user', profile_photo_path: null } }),
  avatarPublicUrl: () => null,
}));

vi.mock('../../../lib/cv-readiness', () => ({
  useProcessedCvReadiness: () => ({ hasProcessedCv: false, loading: false }),
}));

describe('ChatPreviewPage empty state', () => {
  it('shows a processed CV callout before rendering the chat interface', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ChatPreviewPage />
        </LanguageProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Upload a processed CV first')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Quick Start' })).toHaveAttribute('href', '/onboarding');
    expect(screen.queryByText('Chat interface')).not.toBeInTheDocument();
  });
});