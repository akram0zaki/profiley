import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useState } from 'react';
import { Link } from 'react-router';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import { useCurrentProfile } from '../../lib/profile';
import { useLanguage } from '../contexts/language-context';

type JobFitResult = {
  fitBand: string;
  fitScore: number;
  strengths: string[];
  gaps: string[];
  risks: string[];
  transferableStrengths: string[];
  reasoningSummary: string;
  confidenceLabel: string;
  citations: Array<{ label: string; chunkId: string }>;
  modelUsed?: string;
};

export default function JobFitPreviewPage() {
  const { t } = useLanguage();
  const { profile, loading } = useCurrentProfile();
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<JobFitResult | null>(null);

  const handleAnalyze = async () => {
    if (!profile?.slug) {
      toast.error(t('jobFit.input.completeOnboarding'));
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = (await api.analyzeJobFit({
        slug: profile.slug,
        jobDescription,
        jobTitle: jobTitle || undefined,
        companyName: companyName || undefined,
      })) as JobFitResult;
      setResult(res);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('jobFit.feedback.analysisFailed');
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('jobFit.title')}</h1>
          <p className="text-muted-foreground">
            {t('jobFit.subtitle')}
          </p>
        </div>

        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle>{t('jobFit.notice.title')}</CardTitle>
            <CardDescription>{t('jobFit.notice.body')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 pt-0 text-sm">
            <Link to="/legal/privacy" className="text-amber-700 underline underline-offset-4 dark:text-amber-300">
              {t('jobFit.notice.privacy')}
            </Link>
            <a
              href="mailto:privacy@profiley.ai"
              className="text-amber-700 underline underline-offset-4 dark:text-amber-300"
            >
              {t('jobFit.notice.concerns')}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('jobFit.input.title')}</CardTitle>
            <CardDescription>
              {t('jobFit.input.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder={t('jobFit.input.jobTitle')}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
              <Input
                placeholder={t('jobFit.input.company')}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <Textarea
              placeholder={t('jobFit.input.placeholder')}
              rows={12}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => void handleAnalyze()}
                disabled={!jobDescription.trim() || analyzing || loading || !profile?.slug}
                className="gap-2"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {analyzing ? t('jobFit.input.analyzing') : t('jobFit.input.analyze')}
              </Button>
            </div>
            {!loading && !profile?.slug && (
              <p className="text-xs text-muted-foreground">
                {t('jobFit.input.completeOnboarding')}
              </p>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('jobFit.result.title')}</CardTitle>
                    <CardDescription>{t('jobFit.result.subtitle')}</CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-500/10 text-green-400 border-green-500/20"
                  >
                    {result.confidenceLabel} {t('jobFit.result.confidence')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {result.fitScore}%
                  </div>
                  <div className="flex-1">
                    <Progress value={result.fitScore} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.fitBand}
                      {result.modelUsed ? ` — model: ${result.modelUsed}` : ''}
                    </p>
                  </div>
                </div>
                {result.reasoningSummary && (
                  <p className="text-sm text-muted-foreground">{result.reasoningSummary}</p>
                )}
              </CardContent>
            </Card>

            {result.strengths?.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <CardTitle>{t('jobFit.result.strengths')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <TrendingUp className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.gaps?.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-orange-400" />
                    <CardTitle>{t('jobFit.result.gaps')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.gaps.map((g, i) => (
                      <li key={i} className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{g}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.transferableStrengths?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('jobFit.result.transferable')}</CardTitle>
                  <CardDescription>{t('jobFit.result.transferableSubtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.transferableStrengths.map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-blue-400" />
                        </div>
                        <span className="text-sm">{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.risks?.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <CardTitle>{t('jobFit.result.concerns')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.risks.map((r, i) => (
                      <li key={i} className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{r}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Separator />

            <Card className="border-muted">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {t('jobFit.disclaimer')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
