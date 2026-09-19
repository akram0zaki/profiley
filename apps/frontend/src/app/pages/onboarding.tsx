import { Link, useNavigate } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, ArrowRight, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { useDocumentTitle } from '../hooks/use-document-title';
import { api, ApiError } from '../../lib/api';
import { uploadUserDocument, validateDocumentFile } from '../../lib/document-upload';
import { useLanguage } from '../contexts/language-context';

export default function OnboardingPage() {
  const { t } = useLanguage();
  useDocumentTitle(t('onboarding.title'));
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busyAction, setBusyAction] = useState<'upload' | 'skip' | null>(null);
  const browserLocale = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    void api.initializeUserProfile({
      browserLocale,
      timezone,
    }).catch(() => {
      /* non-fatal */
    });
  }, [browserLocale, timezone]);

  const markActivated = async (completionSource: 'skip' | 'cv_upload') => {
    await api.completeActivation({ completionSource });
    window.dispatchEvent(new CustomEvent('profile-updated'));
  };

  const handleSkip = async () => {
    setBusyAction('skip');
    try {
      await markActivated('skip');
      toast.success(t('onboarding.feedback.skipped'));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('onboarding.feedback.skipFailed');
      toast.error(message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleUpload = async (file: File) => {
    const validationError = validateDocumentFile(file);
    if (validationError?.code === 'tooLarge') {
      toast.error(t('onboarding.feedback.tooLarge', { filename: validationError.filename }));
      return;
    }
    if (validationError?.code === 'legacyDoc') {
      toast.error(t('onboarding.feedback.legacyDoc', { filename: validationError.filename }));
      return;
    }
    if (validationError?.code === 'unsupported') {
      toast.error(
        t('onboarding.feedback.unsupported', {
          filename: validationError.filename,
          mimeType: validationError.mimeType,
        }),
      );
      return;
    }

    setBusyAction('upload');
    try {
      await uploadUserDocument(file, {
        documentKind: 'cv',
      });
      await markActivated('cv_upload');
      toast.success(t('onboarding.feedback.uploaded', { filename: file.name }));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('onboarding.feedback.uploadFailed');
      toast.error(message);
    } finally {
      setBusyAction(null);
    }
  };

  const uploadBusy = busyAction === 'upload';
  const skipBusy = busyAction === 'skip';

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-purple-500/5 items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center space-y-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1 text-sm text-purple-200">
            <Sparkles className="h-4 w-4" />
            {t('onboarding.badge')}
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('onboarding.headline')}</h1>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">{t('onboarding.subtitle')}</p>
          </div>
        </div>

        <Card className="border-border/50 bg-card/60 backdrop-blur">
          <CardHeader className="space-y-3">
            <CardTitle>{t('onboarding.card.title')}</CardTitle>
            <CardDescription>{t('onboarding.card.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                <FileText className="mb-3 h-5 w-5 text-blue-400" />
                <h2 className="font-medium">{t('onboarding.benefits.cvTitle')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.benefits.cvBody')}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                <Upload className="mb-3 h-5 w-5 text-purple-400" />
                <h2 className="font-medium">{t('onboarding.benefits.fastTitle')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.benefits.fastBody')}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                <ArrowRight className="mb-3 h-5 w-5 text-cyan-400" />
                <h2 className="font-medium">{t('onboarding.benefits.returnTitle')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.benefits.returnBody')}</p>
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t('onboarding.browserInfo.title')}</p>
              <p className="mt-2">{t('onboarding.browserInfo.description', { locale: browserLocale, timezone })}</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="quick-start-upload" className="sr-only">
                {t('onboarding.actions.uploadFileAria')}
              </Label>
              <input
                id="quick-start-upload"
                ref={inputRef}
                type="file"
                data-testid="quick-start-upload-input"
                accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) {
                    void handleUpload(file);
                  }
                }}
              />
              <Button className="w-full gap-2 md:h-12" onClick={() => inputRef.current?.click()} disabled={Boolean(busyAction)}>
                {uploadBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadBusy ? t('onboarding.actions.uploading') : t('onboarding.actions.uploadCv')}
              </Button>
              <Button variant="outline" className="w-full md:h-12" onClick={() => { void handleSkip(); }} disabled={Boolean(busyAction)}>
                {skipBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {skipBusy ? t('onboarding.actions.skipping') : t('onboarding.actions.skip')}
              </Button>
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p>{t('onboarding.supported')}</p>
              <Link to="/dashboard" className="text-foreground underline underline-offset-4">
                {t('onboarding.dashboardLink')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}