import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { InterviewAnswersSummaryCard } from '../interview-answers-summary-card';

vi.mock('../../contexts/language-context', () => ({
  useLanguage: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

describe('InterviewAnswersSummaryCard', () => {
  it('links to the dedicated interview answers route and summarizes answered prompts', () => {
    render(
      <MemoryRouter>
        <InterviewAnswersSummaryCard answeredQuestionKeys={['skills']} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'profile.interviewAnswers.open' })).toHaveAttribute(
      'href',
      '/interview-answers',
    );
    expect(screen.getByText('interviewAnswers.sets.jobSearch.questions.skills.prompt')).toBeInTheDocument();
    expect(screen.queryByText('profile.skills.add')).not.toBeInTheDocument();
  });
});