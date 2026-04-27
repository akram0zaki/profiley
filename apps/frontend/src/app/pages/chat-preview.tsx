import { AppLayout } from '../components/app-layout';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ChatInterface } from '../components/chat-interface';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';

export default function ChatPreviewPage() {
  const { t } = useLanguage();
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
            </div>
          </CardHeader>
        </Card>

        {/* Chat Card */}
        <Card className="h-[600px] flex flex-col">
          <ChatInterface
            ownerMode
            userName={t('chatPreview.userName')}
            botName={t('chatPreview.botName')}
            placeholder={t('chatPreview.placeholder')}
          />
        </Card>
      </div>
    </AppLayout>
  );
}
