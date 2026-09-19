import type {
  ProfileAnswerCaptureMethod,
  ProfileAnswerRecord,
  ProfileAnswerReviewState,
  ProfileAnswerVisibility,
} from './api';
import type { InterviewQuestionSet } from './interview-question-sets';

export type InterviewAnswerDraft = {
  answerText: string;
  answerSummary: string | null;
  visibility: ProfileAnswerVisibility;
  reviewState: ProfileAnswerReviewState;
  captureMethod: ProfileAnswerCaptureMethod;
  version: number;
  staleAfterAt: string | null;
  saved: boolean;
};

type InterviewAnswerRow = {
  question_key: string | null;
  answer_text: string | null;
  answer_summary?: string | null;
  visibility?: ProfileAnswerVisibility | null;
  review_state?: ProfileAnswerReviewState | null;
  capture_method?: ProfileAnswerCaptureMethod | null;
  version?: number | null;
  stale_after_at?: string | null;
};

export function buildInitialInterviewAnswerDraft(questionSet: InterviewQuestionSet, questionKey: string) {
  const question = questionSet.questions.find((entry) => entry.key === questionKey);
  if (!question) {
    return {
      answerText: '',
      answerSummary: null,
      visibility: 'avatar_queryable' as const,
      reviewState: 'confirmed' as const,
      captureMethod: 'form' as const,
      version: 1,
      staleAfterAt: null,
      saved: false,
    };
  }
  return {
    answerText: '',
    answerSummary: null,
    visibility: question.defaultVisibility,
    reviewState: 'confirmed' as const,
    captureMethod: 'form' as const,
    version: 1,
    staleAfterAt: null,
    saved: false,
  };
}

export function mapProfileAnswerRecordToDraft(
  answer: ProfileAnswerRecord,
  fallbackVisibility: ProfileAnswerVisibility,
): InterviewAnswerDraft {
  return {
    answerText: answer.answer_text ?? '',
    answerSummary: answer.answer_summary ?? null,
    visibility: answer.visibility ?? fallbackVisibility,
    reviewState: answer.review_state,
    captureMethod: answer.capture_method,
    version: answer.version ?? 1,
    staleAfterAt: answer.stale_after_at ?? null,
    saved: answer.review_state === 'confirmed' && Boolean(answer.answer_text?.trim()),
  };
}

export function buildInitialInterviewAnswerDrafts(
  questionSet: InterviewQuestionSet,
): Record<string, InterviewAnswerDraft> {
  return Object.fromEntries(
    questionSet.questions.map((question) => [
      question.key,
      buildInitialInterviewAnswerDraft(questionSet, question.key),
    ]),
  );
}

export function hydrateInterviewAnswerDrafts(
  questionSet: InterviewQuestionSet,
  currentRows: InterviewAnswerRow[],
  legacySkillsAnswerText: string | null,
): Record<string, InterviewAnswerDraft> {
  const nextAnswers = buildInitialInterviewAnswerDrafts(questionSet);
  for (const row of currentRows) {
    if (!row.question_key || !(row.question_key in nextAnswers)) continue;
    nextAnswers[row.question_key] = {
      answerText: row.answer_text ?? '',
      answerSummary: row.answer_summary ?? null,
      visibility: row.visibility ?? nextAnswers[row.question_key].visibility,
      reviewState: row.review_state ?? nextAnswers[row.question_key].reviewState,
      captureMethod: row.capture_method ?? nextAnswers[row.question_key].captureMethod,
      version: row.version ?? nextAnswers[row.question_key].version,
      staleAfterAt: row.stale_after_at ?? nextAnswers[row.question_key].staleAfterAt,
      saved: row.review_state === 'confirmed' && Boolean(row.answer_text?.trim()),
    };
  }
  if (!nextAnswers.skills?.answerText && legacySkillsAnswerText) {
    nextAnswers.skills = {
      answerText: legacySkillsAnswerText,
      answerSummary: null,
      visibility: 'avatar_queryable',
      reviewState: 'confirmed',
      captureMethod: 'form',
      version: 1,
      staleAfterAt: null,
      saved: false,
    };
  }
  return nextAnswers;
}