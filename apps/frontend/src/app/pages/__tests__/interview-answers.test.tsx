import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import InterviewAnswersPage from '../interview-answers';
import { hydrateInterviewAnswerDrafts } from '../../../lib/interview-answer-drafts';
import { INTERVIEW_QUESTION_SETS, JOB_SEARCH_QUESTION_SET_KEY } from '../../../lib/interview-question-sets';

const upsertProfileAnswerMock = vi.fn();
const approveProfileAnswerDraftMock = vi.fn();
const generateProfileAnswerDraftMock = vi.fn();
const rejectProfileAnswerDraftMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const fromMock = vi.fn();
let currentAnswersResult: { data: unknown[]; error: null };
let legacySkillsResult: { data: { answer_text: string } | null; error: null };

vi.mock('../../components/app-layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../contexts/language-context', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

vi.mock('../../hooks/use-document-title', () => ({
  useDocumentTitle: () => undefined,
}));

vi.mock('../../../lib/profile', () => ({
  useCurrentProfile: () => ({
    appUser: { id: 'user-1', email: 'user@example.com' },
  }),
}));

vi.mock('../../../lib/api', async () => {
  const actual = await vi.importActual('../../../lib/api');
  return {
    ...actual,
    api: {
      upsertProfileAnswer: (...args: unknown[]) => upsertProfileAnswerMock(...args),
      approveProfileAnswerDraft: (...args: unknown[]) => approveProfileAnswerDraftMock(...args),
      generateProfileAnswerDraft: (...args: unknown[]) => generateProfileAnswerDraftMock(...args),
      rejectProfileAnswerDraft: (...args: unknown[]) => rejectProfileAnswerDraftMock(...args),
    },
    ApiError: actual.ApiError,
  };
});

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

function createOnboardingAnswersQuery() {
  const filters: Record<string, unknown> = {};
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: (column: string, value: unknown) => {
      filters[column] = value;
      return builder;
    },
    in: () => builder,
    maybeSingle: () =>
      Promise.resolve(
        filters.question_set_key === 'legacy_onboarding' ? legacySkillsResult : { data: null, error: null },
      ),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(currentAnswersResult).then(resolve),
  };
  return builder;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <InterviewAnswersPage />
    </MemoryRouter>,
  );
}

describe('InterviewAnswersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertProfileAnswerMock.mockResolvedValue({
      answer: {
        id: 'answer-1',
        question_key: 'strengths',
        answer_text: 'Saved answer',
        answer_summary: 'Saved answer',
        visibility: 'avatar_queryable',
        review_state: 'confirmed',
        capture_method: 'form',
        version: 1,
        stale_after_at: '2027-05-13T00:00:00.000Z',
        updated_at: '2026-05-13T00:00:00.000Z',
      },
    });
    approveProfileAnswerDraftMock.mockResolvedValue({
      answer: {
        id: 'answer-1',
        question_key: 'strengths',
        answer_text: 'Approved draft answer',
        answer_summary: 'Approved draft answer',
        visibility: 'public_profile',
        review_state: 'confirmed',
        capture_method: 'chat',
        version: 3,
        stale_after_at: '2027-05-13T00:00:00.000Z',
        updated_at: '2026-05-13T00:00:00.000Z',
      },
    });
    generateProfileAnswerDraftMock.mockResolvedValue({ answer: null, modelUsed: 'test', followUpQuestion: null });
    rejectProfileAnswerDraftMock.mockResolvedValue({ answer: null, restored: false });
    currentAnswersResult = { data: [], error: null };
    legacySkillsResult = { data: null, error: null };
    fromMock.mockImplementation(() => createOnboardingAnswersQuery());
  });

  it('prefills legacy skills when the new question set has no skills answer yet', async () => {
    expect(
      hydrateInterviewAnswerDrafts(
        INTERVIEW_QUESTION_SETS[JOB_SEARCH_QUESTION_SET_KEY],
        [],
        'React, Accessibility',
      ).skills,
    ).toEqual({
      answerText: 'React, Accessibility',
      answerSummary: null,
      visibility: 'avatar_queryable',
      reviewState: 'confirmed',
      captureMethod: 'form',
      version: 1,
      staleAfterAt: null,
      saved: false,
    });
  });

  it('saves answers with the question-set defaults for manual authoring', async () => {
    currentAnswersResult = {
      data: [{ question_key: 'strengths', answer_text: 'Clear writing', visibility: 'avatar_queryable', review_state: 'confirmed', capture_method: 'form', version: 1, stale_after_at: null }],
      error: null,
    };

    renderPage();

    fireEvent.change(
      await screen.findByPlaceholderText('interviewAnswers.sets.jobSearch.questions.strengths.placeholder'),
      {
        target: {
          value: 'I make complex work legible for technical and non-technical stakeholders.',
        },
      },
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'interviewAnswers.actions.saveAnswer interviewAnswers.sets.jobSearch.questions.strengths.prompt',
      }),
    );

    await waitFor(() => {
      expect(upsertProfileAnswerMock).toHaveBeenCalledWith({
        questionSetKey: 'job_search_v1',
        questionKey: 'strengths',
        answerText: 'I make complex work legible for technical and non-technical stakeholders.',
        answerSummary: 'I make complex work legible for technical and non-technical stakeholders.',
        captureMethod: 'form',
        visibility: 'avatar_queryable',
        reviewState: 'confirmed',
      });
    });
  });

  it('requires explicit approval before an AI draft becomes active', async () => {
    currentAnswersResult = {
      data: [{
        question_key: 'strengths',
        answer_text: 'Draft answer from AI',
        answer_summary: 'Draft answer from AI',
        visibility: 'private',
        review_state: 'draft',
        capture_method: 'chat',
        version: 2,
        stale_after_at: '2027-05-13T00:00:00.000Z',
      }],
      error: null,
    };

    renderPage();

    fireEvent.change(
      await screen.findByPlaceholderText('interviewAnswers.sets.jobSearch.questions.strengths.placeholder'),
      {
        target: {
          value: 'Approved draft answer',
        },
      },
    );

    fireEvent.change(screen.getByLabelText('interviewAnswers.fields.visibility', { selector: 'select#visibility-strengths' }), {
      target: { value: 'public_profile' },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'interviewAnswers.actions.approveDraft interviewAnswers.sets.jobSearch.questions.strengths.prompt',
      }),
    );

    await waitFor(() => {
      expect(approveProfileAnswerDraftMock).toHaveBeenCalledWith({
        questionSetKey: 'job_search_v1',
        questionKey: 'strengths',
        answerText: 'Approved draft answer',
        answerSummary: 'Approved draft answer',
        visibility: 'public_profile',
        version: 2,
        staleAfterAt: '2027-05-13T00:00:00.000Z',
      });
    });
  });
});