import { Link } from 'react-router';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/language-context';
import { INTERVIEW_QUESTION_SETS, JOB_SEARCH_QUESTION_SET_KEY } from '../../lib/interview-question-sets';

const interviewQuestionSet = INTERVIEW_QUESTION_SETS[JOB_SEARCH_QUESTION_SET_KEY];

export function InterviewAnswersSummaryCard({ answeredQuestionKeys }: { answeredQuestionKeys: string[] }) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.interviewAnswers.title')}</CardTitle>
        <CardDescription>{t('profile.interviewAnswers.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="font-medium">
            {t('profile.interviewAnswers.progress', {
              count: answeredQuestionKeys.length,
              total: interviewQuestionSet.questions.length,
            })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {answeredQuestionKeys.length > 0
              ? answeredQuestionKeys
                  .map((questionKey) => {
                    const question = interviewQuestionSet.questions.find((item) => item.key === questionKey);
                    return question ? t(question.promptKey) : questionKey;
                  })
                  .join(' · ')
              : t('profile.interviewAnswers.empty')}
          </p>
        </div>
        <Link to="/interview-answers">
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('profile.interviewAnswers.open')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}