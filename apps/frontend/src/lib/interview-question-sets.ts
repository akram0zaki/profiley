import type { ProfileAnswerVisibility } from './api';

export const JOB_SEARCH_QUESTION_SET_KEY = 'job_search_v1';

export type InterviewQuestion = {
  key: string;
  promptKey: string;
  helperKey: string;
  placeholderKey: string;
  defaultVisibility: ProfileAnswerVisibility;
};

export type InterviewQuestionSet = {
  key: string;
  titleKey: string;
  descriptionKey: string;
  estimatedTimeKey: string;
  questions: InterviewQuestion[];
};

export const INTERVIEW_QUESTION_SETS: Record<string, InterviewQuestionSet> = {
  [JOB_SEARCH_QUESTION_SET_KEY]: {
    key: JOB_SEARCH_QUESTION_SET_KEY,
    titleKey: 'interviewAnswers.sets.jobSearch.title',
    descriptionKey: 'interviewAnswers.sets.jobSearch.description',
    estimatedTimeKey: 'interviewAnswers.sets.jobSearch.estimatedTime',
    questions: [
      {
        key: 'skills',
        promptKey: 'interviewAnswers.sets.jobSearch.questions.skills.prompt',
        helperKey: 'interviewAnswers.sets.jobSearch.questions.skills.helper',
        placeholderKey: 'interviewAnswers.sets.jobSearch.questions.skills.placeholder',
        defaultVisibility: 'avatar_queryable',
      },
      {
        key: 'strengths',
        promptKey: 'interviewAnswers.sets.jobSearch.questions.strengths.prompt',
        helperKey: 'interviewAnswers.sets.jobSearch.questions.strengths.helper',
        placeholderKey: 'interviewAnswers.sets.jobSearch.questions.strengths.placeholder',
        defaultVisibility: 'avatar_queryable',
      },
      {
        key: 'working_style',
        promptKey: 'interviewAnswers.sets.jobSearch.questions.workingStyle.prompt',
        helperKey: 'interviewAnswers.sets.jobSearch.questions.workingStyle.helper',
        placeholderKey: 'interviewAnswers.sets.jobSearch.questions.workingStyle.placeholder',
        defaultVisibility: 'avatar_queryable',
      },
      {
        key: 'target_roles',
        promptKey: 'interviewAnswers.sets.jobSearch.questions.targetRoles.prompt',
        helperKey: 'interviewAnswers.sets.jobSearch.questions.targetRoles.helper',
        placeholderKey: 'interviewAnswers.sets.jobSearch.questions.targetRoles.placeholder',
        defaultVisibility: 'avatar_queryable',
      },
    ],
  },
};