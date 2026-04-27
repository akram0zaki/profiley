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

export default function SettingsPage() {
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
      toast.success('Language preference saved');
      await reload();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Update failed';
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
      toast.error(e?.message ?? 'Update failed');
    }
  };

  const togglePublic = async (next: boolean) => {
    try {
      await api.publishProfile({ publicVisibility: next });
      toast.success(next ? 'Profile published' : 'Profile unpublished');
      await reload();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Update failed';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading settings…
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
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
                    <CardTitle className="text-base">AI Configuration</CardTitle>
                    <CardDescription className="text-sm">Model and persona settings</CardDescription>
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
                    <CardTitle className="text-base">Avatar Settings</CardTitle>
                    <CardDescription className="text-sm">Future AI avatar config</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your authenticated account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={appUser?.email ?? ''} disabled />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" value={appUser?.timezone ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locale">Browser Locale</Label>
              <Input id="locale" value={appUser?.browser_locale ?? ''} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language & Region</CardTitle>
            <CardDescription>Configure your language preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">Preferred Language</Label>
              <Select value={language} onValueChange={handleLanguageChange} disabled={savingLocale}>
                <SelectTrigger id="preferredLanguage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                AI will prefer this language when responding to ambiguous requests
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy & Visibility</CardTitle>
            <CardDescription>
              Control who can see your profile and interact with your AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Make your profile visible to anyone with the link
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
                <Label>Allow AI Chat</Label>
                <p className="text-sm text-muted-foreground">Let visitors chat with your AI persona</p>
              </div>
              <Switch
                checked={preferences?.allow_public_chat ?? true}
                onCheckedChange={(v) => togglePref('allow_public_chat', v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Job-Fit Analysis</Label>
                <p className="text-sm text-muted-foreground">
                  Let recruiters analyze job descriptions against your profile
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
                <Label>Allow Contact Form</Label>
                <p className="text-sm text-muted-foreground">
                  Let recruiters send you direct messages
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
                <Label>Show Document Citations</Label>
                <p className="text-sm text-muted-foreground">
                  Display source references in AI responses
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
            <CardTitle className="text-destructive">Sign Out</CardTitle>
            <CardDescription>End your current session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Sign out of Profiley</p>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to the login page
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  void signOut();
                }}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
