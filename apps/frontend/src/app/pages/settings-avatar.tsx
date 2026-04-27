import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router';
import { ArrowLeft, Upload, Video, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';

export default function SettingsAvatarPage() {
  const { t } = useLanguage();
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t('settingsAvatar.title')}</h1>
            <p className="text-muted-foreground">
              {t('settingsAvatar.subtitle')}
            </p>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{t('settingsAvatar.comingSoon.title')}</h3>
                  <Badge variant="secondary">{t('settingsAvatar.comingSoon.phase')}</Badge>
                </div>
                <p className="text-muted-foreground">
                  {t('settingsAvatar.comingSoon.description')}
                </p>
                <div className="pt-2">
                  <h4 className="font-medium mb-2">{t('settingsAvatar.comingSoon.plannedTitle')}</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• {t('settingsAvatar.comingSoon.planned.photo')}</li>
                    <li>• {t('settingsAvatar.comingSoon.planned.voice')}</li>
                    <li>• {t('settingsAvatar.comingSoon.planned.video')}</li>
                    <li>• {t('settingsAvatar.comingSoon.planned.lipsync')}</li>
                    <li>• {t('settingsAvatar.comingSoon.planned.transcripts')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avatar Photo */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-400" />
              <CardTitle>{t('settingsAvatar.photo.title')}</CardTitle>
            </div>
            <CardDescription>
              {t('settingsAvatar.photo.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-32 w-32 border-2 border-border">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Akram" alt="Avatar" />
                <AvatarFallback>AK</AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div>
                  <Button variant="outline" className="gap-2" disabled>
                    <Upload className="h-4 w-4" />
                    {t('settingsAvatar.photo.upload')}
                  </Button>
                  <Badge variant="secondary" className="ml-2">{t('settingsAvatar.photo.comingSoon')}</Badge>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• {t('settingsAvatar.photo.tips.frontFacing')}</li>
                  <li>• {t('settingsAvatar.photo.tips.headshot')}</li>
                  <li>• {t('settingsAvatar.photo.tips.resolution')}</li>
                  <li>• {t('settingsAvatar.photo.tips.lighting')}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avatar Provider */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settingsAvatar.provider.title')}</CardTitle>
            <CardDescription>
              {t('settingsAvatar.provider.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border border-border/50 opacity-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{t('settingsAvatar.provider.heygen.name')}</h4>
                  <Badge variant="outline">{t('settingsAvatar.provider.planned')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('settingsAvatar.provider.heygen.description')}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border/50 opacity-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{t('settingsAvatar.provider.synthesia.name')}</h4>
                  <Badge variant="outline">{t('settingsAvatar.provider.planned')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('settingsAvatar.provider.synthesia.description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settingsAvatar.voice.title')}</CardTitle>
            <CardDescription>
              {t('settingsAvatar.voice.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border border-border/50 bg-muted/50">
              <p className="text-sm">
                {t('settingsAvatar.voice.currentModel')}
                <br />
                {t('settingsAvatar.voice.style')}
              </p>
              <Link to="/settings/ai" className="inline-block mt-3">
                <Button variant="outline" size="sm">
                  {t('settingsAvatar.voice.configure')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Future Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settingsAvatar.sessions.title')}</CardTitle>
            <CardDescription>
              {t('settingsAvatar.sessions.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('settingsAvatar.sessions.empty')}</p>
              <p className="text-sm">{t('settingsAvatar.sessions.phaseNote')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-start">
          <Link to="/settings">
            <Button variant="outline">{t('settingsAvatar.back')}</Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
