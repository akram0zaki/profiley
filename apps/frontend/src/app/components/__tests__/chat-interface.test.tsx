import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from '../../contexts/language-context';
import { ChatInterface } from '../chat-interface';

vi.mock('../../../lib/api', () => ({
  api: {
    chatPersona: vi.fn(),
    testPersonaChat: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  },
}));

describe('ChatInterface greeting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('renders the greeting with the profile owner name and refreshes it when that name loads later', async () => {
    const { rerender } = render(
      <LanguageProvider>
        <ChatInterface ownerMode botName="Your AI Persona" />
      </LanguageProvider>,
    );

    expect(
      screen.getByText(
        "Hello! I'm the AI Avatar of Your AI Persona. Ask me about experience, skills, projects, or qualifications.",
      ),
    ).toBeInTheDocument();

    rerender(
      <LanguageProvider>
        <ChatInterface ownerMode botName="Your AI Persona" profileName="Akram Zaki" />
      </LanguageProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "Hello! I'm the AI Avatar of Akram Zaki. Ask me about experience, skills, projects, or qualifications.",
        ),
      ).toBeInTheDocument();
    });
  });
});