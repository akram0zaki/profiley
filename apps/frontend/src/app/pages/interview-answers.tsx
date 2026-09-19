import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, Loader2, Save, Sparkles, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/language-context';
import { useDocumentTitle } from '../hooks/use-document-title';
import { api, type ProfileAnswerRecord, type ProfileAnswerVisibility, ApiError } from '../../lib/api';
import {
  buildInitialInterviewAnswerDraft,
  buildInitialInterviewAnswerDrafts,
  hydrateInterviewAnswerDrafts,
  mapProfileAnswerRecordToDraft,
  type InterviewAnswerDraft,
} from '../../lib/interview-answer-drafts';
import { useCurrentProfile } from '../../lib/profile';
import { supabase } from '../../lib/supabase';
import { INTERVIEW_QUESTION_SETS, JOB_SEARCH_QUESTION_SET_KEY } from '../../lib/interview-question-sets';

const questionSet = INTERVIEW_QUESTION_SETS[JOB_SEARCH_QUESTION_SET_KEY];

function buildSummary(answerText: string) {
  const trimmed = answerText.trim();
  if (!trimmed) return null;
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
}

export default function InterviewAnswersPage() {
  const { t, language } = useLanguage();
  useDocumentTitle(t('interviewAnswers.title'));
  const { appUser } = useCurrentProfile();
  const appUserId = appUser?.id ?? null;
  const [answers, setAnswers] = useState<Record<string, InterviewAnswerDraft>>(() =>
    buildInitialInterviewAnswerDrafts(questionSet),
  );
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [approvingKey, setApprovingKey] = useState<string | null>(null);
  const [rejectingKey, setRejectingKey] = useState<string | null>(null);
  const [aiNotesByQuestion, setAiNotesByQuestion] = useState<Record<string, string>>({});
  const [followUpByQuestion, setFollowUpByQuestion] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!appUserId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const questionKeys = questionSet.questions.map((question) => question.key);
      const [currentRes, legacySkillsRes] = await Promise.all([
        supabase
          .from('onboarding_answers')
          .select('question_key, answer_text, answer_summary, visibility, review_state, capture_method, version, stale_after_at')
          .eq('user_id', appUserId)
          .eq('question_set_key', JOB_SEARCH_QUESTION_SET_KEY)
          .in('question_key', questionKeys),
        supabase
          .from('onboarding_answers')
          .select('answer_text')
          .eq('user_id', appUserId)
          .eq('question_set_key', 'legacy_onboarding')
          .eq('question_key', 'skills')
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setAnswers(
        hydrateInterviewAnswerDrafts(
          questionSet,
          (currentRes.data ?? []) as Array<{
            question_key: string | null;
            answer_text: string | null;
            answer_summary?: string | null;
            visibility?: ProfileAnswerVisibility | null;
            review_state?: 'draft' | 'confirmed' | 'stale' | null;
            capture_method?: 'form' | 'chat' | 'imported' | null;
            version?: number | null;
            stale_after_at?: string | null;
          }>,
          legacySkillsRes.data?.answer_text ?? null,
        ),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [appUserId]);

  const answeredCount = useMemo(
    () => questionSet.questions.filter((question) => answers[question.key]?.answerText.trim()).length,
    [answers],
  );

  const applyAnswerRecord = (questionKey: string, answer: ProfileAnswerRecord) => {
    const question = questionSet.questions.find((entry) => entry.key === questionKey);
    const fallbackVisibility = question?.defaultVisibility ?? 'avatar_queryable';
    setAnswers((current) => ({
      ...current,
      [questionKey]: mapProfileAnswerRecordToDraft(answer, fallbackVisibility),
    }));
  };

  const saveAnswer = async (questionKey: string) => {
    const draft = answers[questionKey];
    if (!draft?.answerText.trim()) return;
    setSavingKey(questionKey);
    try {
      await api.upsertProfileAnswer({
        questionSetKey: JOB_SEARCH_QUESTION_SET_KEY,
        questionKey,
        answerText: draft.answerText.trim(),
        answerSummary: buildSummary(draft.answerText),
        captureMethod: 'form',
        visibility: draft.visibility,
        reviewState: 'confirmed',
      });
      applyAnswerRecord(questionKey, {
        ...result.answer,
        answer_text: draft.answerText.trim(),
      });
      toast.success(t('interviewAnswers.feedback.saved'));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('interviewAnswers.feedback.saveFailed');
      toast.error(message);
    } finally {
      setSavingKey(null);
    }
  };

  const generateDraft = async (questionKey: string) => {
    const draft = answers[questionKey];
    const question = questionSet.questions.find((entry) => entry.key === questionKey);
    const sourceNotes = aiNotesByQuestion[questionKey]?.trim() ?? '';
    if (!question || sourceNotes.length < 20) return;
    setGeneratingKey(questionKey);
    try {
      const result = await api.generateProfileAnswerDraft({
        questionSetKey: JOB_SEARCH_QUESTION_SET_KEY,
        questionKey,
        questionPrompt: t(question.promptKey),
        questionHelper: t(question.helperKey),
        sourceNotes,
        currentAnswerText: draft?.answerText?.trim() || null,
        language,
      });
      applyAnswerRecord(questionKey, result.answer);
      setFollowUpByQuestion((current) => ({
        ...current,
        [questionKey]: result.followUpQuestion,
      }));
      toast.success(t('interviewAnswers.feedback.draftGenerated'));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('interviewAnswers.feedback.generateFailed');
      toast.error(message);
    } finally {
      setGeneratingKey(null);
    }
  };

  const approveDraft = async (questionKey: string) => {
    const draft = answers[questionKey];
    if (!draft?.answerText.trim()) return;
    setApprovingKey(questionKey);
    try {
      const result = await api.approveProfileAnswerDraft({
        questionSetKey: JOB_SEARCH_QUESTION_SET_KEY,
        questionKey,
        answerText: draft.answerText.trim(),
        answerSummary: buildSummary(draft.answerText),
        visibility: draft.visibility,
        version: draft.version,
        staleAfterAt: draft.staleAfterAt,
      });
      applyAnswerRecord(questionKey, result.answer);
      toast.success(t('interviewAnswers.feedback.draftApproved'));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('interviewAnswers.feedback.approveFailed');
      toast.error(message);
    } finally {
      setApprovingKey(null);
    }
  };

  const rejectDraft = async (questionKey: string) => {
    setRejectingKey(questionKey);
    try {
      const result = await api.rejectProfileAnswerDraft({
        questionSetKey: JOB_SEARCH_QUESTION_SET_KEY,
        questionKey,
      });
      if (result.answer) {
        applyAnswerRecord(questionKey, result.answer);
      } else {
        setAnswers((current) => ({
          ...current,
          [questionKey]: buildInitialInterviewAnswerDraft(questionSet, questionKey),
        }));
      }
      setFollowUpByQuestion((current) => ({
        ...current,
        [questionKey]: null,
      }));
      toast.success(t('interviewAnswers.feedback.draftRejected'));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('interviewAnswers.feedback.rejectFailed');
      toast.error(message);
    } finally {
      setRejectingKey(null);
    }
  };

  const formatReviewDate = (value: string | null) => {
    if (!value) return null;
    return new Date(value).toLocaleDateString(language);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">{t('interviewAnswers.badge')}</Badge>
            <div>
              <h1 className="text-3xl font-bold">{t('interviewAnswers.title')}</h1>
              <p className="text-muted-foreground">{t('interviewAnswers.subtitle')}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3 text-sm">
            <p className="font-medium">{t(questionSet.titleKey)}</p>
            <p className="text-muted-foreground">{t('interviewAnswers.progress', { count: answeredCount, total: questionSet.questions.length })}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t(questionSet.titleKey)}</CardTitle>
            <CardDescription>{t(questionSet.descriptionKey)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t(questionSet.estimatedTimeKey)}</p>
            <p>{t('interviewAnswers.visibilityHint')}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/profile">
                <Button variant="outline">{t('interviewAnswers.actions.backToProfile')}</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost">{t('interviewAnswers.actions.backToDashboard')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {!loading && answeredCount === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              {t('interviewAnswers.emptyState')}
            </CardContent>
          </Card>
        )}

        {questionSet.questions.map((question) => {
          const draft = answers[question.key] ?? buildInitialInterviewAnswerDraft(questionSet, question.key);
          const isSaving = savingKey === question.key;
          const isGenerating = generatingKey === question.key;
          const isApproving = approvingKey === question.key;
          const isRejecting = rejectingKey === question.key;
          const reviewDate = formatReviewDate(draft.staleAfterAt);
          const reviewOverdue = Boolean(draft.staleAfterAt && new Date(draft.staleAfterAt).getTime() < Date.now());
          return (
            <Card key={question.key}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{t(question.promptKey)}</CardTitle>
                    <CardDescription>{t(question.helperKey)}</CardDescription>
                  </div>
                  <Badge variant={draft.saved ? 'default' : 'secondary'}>
                    {draft.reviewState === 'draft'
                      ? t('interviewAnswers.status.draft')
                      : draft.saved
                        ? t('interviewAnswers.status.saved')
                        : t('interviewAnswers.status.pending')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium">{t('interviewAnswers.aiAssist.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('interviewAnswers.aiAssist.description')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`ai-notes-${question.key}`}>{t('interviewAnswers.fields.aiNotes')}</Label>
                    <Textarea
                      id={`ai-notes-${question.key}`}
                      rows={4}
                      placeholder={t('interviewAnswers.aiAssist.notesPlaceholder')}
                      value={aiNotesByQuestion[question.key] ?? ''}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setAiNotesByQuestion((current) => ({
                          ...current,
                          [question.key]: nextValue,
                        }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground">{t('interviewAnswers.aiAssist.notesHint')}</p>
                  </div>
                  {followUpByQuestion[question.key] && (
                    <p className="text-sm text-muted-foreground">
                      {t('interviewAnswers.aiAssist.followUp', {
                        question: followUpByQuestion[question.key] ?? '',
                      })}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={isGenerating || (aiNotesByQuestion[question.key]?.trim().length ?? 0) < 20}
                    onClick={() => void generateDraft(question.key)}
                    aria-label={`${t('interviewAnswers.actions.generateDraft')} ${t(question.promptKey)}`}
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {t('interviewAnswers.actions.generateDraft')}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`answer-${question.key}`}>{t('interviewAnswers.fields.answer')}</Label>
                  <Textarea
                    id={`answer-${question.key}`}
                    rows={5}
                    placeholder={t(question.placeholderKey)}
                    value={draft.answerText}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setAnswers((current) => ({
                        ...current,
                        [question.key]: {
                          ...current[question.key],
                          answerText: nextValue,
                          answerSummary: buildSummary(nextValue),
                          saved: current[question.key].reviewState === 'confirmed' ? false : current[question.key].saved,
                        },
                      }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`visibility-${question.key}`}>{t('interviewAnswers.fields.visibility')}</Label>
                  <select
                    id={`visibility-${question.key}`}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={draft.visibility}
                    onChange={(event) => {
                      const nextVisibility = event.target.value as ProfileAnswerVisibility;
                      setAnswers((current) => ({
                        ...current,
                        [question.key]: {
                          ...current[question.key],
                          visibility: nextVisibility,
                          saved: false,
                        },
                      }));
                    }}
                  >
                    <option value="avatar_queryable">{t('interviewAnswers.visibility.avatarQueryable')}</option>
                    <option value="public_profile">{t('interviewAnswers.visibility.publicProfile')}</option>
                    <option value="private">{t('interviewAnswers.visibility.private')}</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>{t('interviewAnswers.meta.version', { version: draft.version })}</span>
                  {reviewDate && (
                    <span>
                      {reviewOverdue
                        ? t('interviewAnswers.meta.reviewOverdue', { date: reviewDate })
                        : t('interviewAnswers.meta.reviewBy', { date: reviewDate })}
                    </span>
                  )}
                  <span>
                    {draft.captureMethod === 'chat'
                      ? t('interviewAnswers.meta.captureMethodChat')
                      : t('interviewAnswers.meta.captureMethodForm')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {draft.reviewState === 'draft' ? (
                    <>
                      <Button
                        className="gap-2"
                        disabled={isApproving || !draft.answerText.trim()}
                        onClick={() => void approveDraft(question.key)}
                        aria-label={`${t('interviewAnswers.actions.approveDraft')} ${t(question.promptKey)}`}
                      >
                        {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {t('interviewAnswers.actions.approveDraft')}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        disabled={isRejecting}
                        onClick={() => void rejectDraft(question.key)}
                        aria-label={`${t('interviewAnswers.actions.rejectDraft')} ${t(question.promptKey)}`}
                      >
                        {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        {t('interviewAnswers.actions.rejectDraft')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="gap-2"
                      disabled={isSaving || !draft.answerText.trim()}
                      onClick={() => void saveAnswer(question.key)}
                      aria-label={`${t('interviewAnswers.actions.saveAnswer')} ${t(question.promptKey)}`}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {t('interviewAnswers.actions.saveAnswer')}
                    </Button>
                  )}
                  {draft.saved && (
                    <span className="inline-flex items-center gap-2 text-sm text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('interviewAnswers.status.readyForAvatar')}
                    </span>
                  )}
                  {draft.reviewState === 'draft' && (
                    <span className="inline-flex items-center gap-2 text-sm text-amber-600">
                      <Sparkles className="h-4 w-4" />
                      {t('interviewAnswers.status.draftNeedsApproval')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}