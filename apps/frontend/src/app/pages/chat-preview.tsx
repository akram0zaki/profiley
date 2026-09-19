import { AppLayout } from '../components/app-layout';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ChatInterface } from '../components/chat-interface';
import { Link } from 'react-router';
import { AlertCircle, Upload } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { useCurrentProfile, avatarPublicUrl } from '../../lib/profile';
import { useProcessedCvReadiness } from '../../lib/cv-readiness';
import { useDocumentTitle } from '../hooks/use-document-title';
import { Button } from '../components/ui/button';
import { CardContent } from '../components/ui/card';

export default function ChatPreviewPage() {
  const { t } = useLanguage();
  useDocumentTitle(t('chatPreview.title'));
  const { profile } = useCurrentProfile();
  const { hasProcessedCv, loading } = useProcessedCvReadiness();
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{t('chatPreview.title')}</h1>
          <p className="text-muted-foreground">
            {t('chatPreview.subtitle')}
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader className="flex flex-row items-start gap-4">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <CardTitle className="text-base">{t('chatPreview.info.title')}</CardTitle>
              <CardDescription>
                {t('chatPreview.info.description')}
              </CardDescription>
              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <Link to="/legal/privacy" className="text-blue-700 underline underline-offset-4 dark:text-blue-300">
                  {t('chatPreview.info.privacy')}
                </Link>
                <a
                  href="mailto:privacy@profiley.ai"
                  className="text-blue-700 underline underline-offset-4 dark:text-blue-300"
                >
                  {t('chatPreview.info.concerns')}
                </a>
              </div>
            </div>
          </CardHeader>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              {t('dashboard.loading')}
            </CardContent>
          </Card>
        ) : !hasProcessedCv ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle>{t('chatPreview.emptyState.title')}</CardTitle>
              <CardDescription>{t('chatPreview.emptyState.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 pt-0">
              <Link to="/onboarding">
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t('chatPreview.emptyState.quickStart')}
                </Button>
              </Link>
              <Link to="/uploads">
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t('chatPreview.emptyState.uploads')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-[600px] flex flex-col">
            <ChatInterface
              ownerMode
              userName={t('chatPreview.userName')}
              botName={t('chatPreview.botName')}
              profileName={profile?.full_name ?? profile?.slug ?? undefined}
              botAvatar={avatarPublicUrl(profile?.profile_photo_path ?? null) || undefined}
              placeholder={t('chatPreview.placeholder')}
            />
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
