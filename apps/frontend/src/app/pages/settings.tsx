import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Link } from 'react-router';
import { Bot, User, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useCurrentProfile, updatePreferences } from '../../lib/profile';
import { api, ApiError } from '../../lib/api';
import { signOut } from '../../lib/auth';
import { useLanguage } from '../contexts/language-context';

export default function SettingsPage() {
  const { t, setLanguage: setUiLanguage } = useLanguage();
  const { appUser, profile, preferences, loading, reload } = useCurrentProfile();
  const [language, setLanguage] = useState('en');
  const [savingLocale, setSavingLocale] = useState(false);

  useEffect(() => {
    if (appUser?.preferred_language) setLanguage(appUser.preferred_language);
  }, [appUser]);

  const handleLanguageChange = async (next: string) => {
    setLanguage(next);
    setSavingLocale(true);
    try {
      await api.updateUserLocale({ preferredLanguage: next });
      if (next === 'en' || next === 'nl' || next === 'ar') {
        setUiLanguage(next);
      }
      toast.success(t('settings.feedback.languageSaved'));
      await reload();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('settings.feedback.updateFailed');
      toast.error(msg);
    } finally {
      setSavingLocale(false);
    }
  };

  const togglePref = async (
    key:
      | 'allow_public_chat'
      | 'allow_job_fit_analysis'
      | 'allow_contact_form'
      | 'allow_document_citation',
    value: boolean,
  ) => {
    if (!appUser) return;
    try {
      await updatePreferences(appUser.id, { [key]: value });
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? t('settings.feedback.updateFailed'));
    }
  };

  const togglePublic = async (next: boolean) => {
    try {
      await api.publishProfile({ publicVisibility: next });
      toast.success(next ? t('settings.feedback.languageSaved') : t('settings.feedback.languageSaved'));
      await reload();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('settings.feedback.updateFailed');
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> {t('settings.loading')}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/settings/ai">
            <Card className="cursor-pointer hover:border-purple-500/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t('settings.links.ai.title')}</CardTitle>
                    <CardDescription className="text-sm">{t('settings.links.ai.description')}</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>

          <Link to="/settings/avatar">
            <Card className="cursor-pointer hover:border-blue-500/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t('settings.links.avatar.title')}</CardTitle>
                    <CardDescription className="text-sm">{t('settings.links.avatar.description')}</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.account.title')}</CardTitle>
            <CardDescription>{t('settings.account.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('settings.account.email')}</Label>
              <Input id="email" type="email" value={appUser?.email ?? ''} disabled />
              <p className="text-xs text-muted-foreground">
                {t('settings.account.emailNote')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t('settings.account.timezone')}</Label>
              <Input id="timezone" value={appUser?.timezone ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locale">{t('settings.account.browserLocale')}</Label>
              <Input id="locale" value={appUser?.browser_locale ?? ''} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.language.title')}</CardTitle>
            <CardDescription>{t('settings.language.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">{t('settings.language.preferred')}</Label>
              <Select value={language} onValueChange={handleLanguageChange} disabled={savingLocale}>
                <SelectTrigger id="preferredLanguage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('settings.language.preferredHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.privacy.title')}</CardTitle>
            <CardDescription>
              {t('settings.privacy.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.privacy.publicProfile.title')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.privacy.publicProfile.description')}
                </p>
              </div>
              <Switch
                checked={profile?.public_visibility ?? false}
                onCheckedChange={togglePublic}
                disabled={!profile}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.privacy.chat.title')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.privacy.chat.description')}</p>
              </div>
              <Switch
                checked={preferences?.allow_public_chat ?? true}
                onCheckedChange={(v) => togglePref('allow_public_chat', v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.privacy.jobFit.title')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.privacy.jobFit.description')}
                </p>
              </div>
              <Switch
                checked={preferences?.allow_job_fit_analysis ?? true}
                onCheckedChange={(v) => togglePref('allow_job_fit_analysis', v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.privacy.contact.title')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.privacy.contact.description')}
                </p>
              </div>
              <Switch
                checked={preferences?.allow_contact_form ?? true}
                onCheckedChange={(v) => togglePref('allow_contact_form', v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.privacy.citations.title')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.privacy.citations.description')}
                </p>
              </div>
              <Switch
                checked={preferences?.allow_document_citation ?? true}
                onCheckedChange={(v) => togglePref('allow_document_citation', v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">{t('settings.signOut.title')}</CardTitle>
            <CardDescription>{t('settings.signOut.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">{t('settings.signOut.button')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.signOut.redirectNote')}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  void signOut();
                }}
              >
                {t('settings.signOut.title')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
