import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { ChatInterface } from '../components/chat-interface';
import {
  MapPin,
  Mail,
  MessageSquare,
  Briefcase,
  Shield,
  Sparkles,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../contexts/language-context';
import { useDocumentTitle } from '../hooks/use-document-title';

type PublicProfile = {
  id: string;
  user_id: string;
  slug: string;
  full_name: string | null;
  headline: string | null;
  short_bio: string | null;
  long_bio: string | null;
  current_location: string | null;
  profile_photo_path: string | null;
  photoUrl: string | null;
  allow_public_chat: boolean;
  allow_job_fit_analysis: boolean;
  allow_contact_form: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
};

declare global {
  interface Window {
    hcaptcha?: any;
  }
}

const CAPTCHA_SITE_KEY = (import.meta as any).env?.VITE_CAPTCHA_SITE_KEY as string | undefined;

function UsageNotice({
  title,
  body,
  privacyLabel,
  concernsLabel,
}: {
  title: string;
  body: string;
  privacyLabel: string;
  concernsLabel: string;
}) {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader className="flex flex-row items-start gap-4">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{body}</CardDescription>
          <div className="flex flex-wrap gap-4 pt-2 text-xs">
            <Link to="/legal/privacy" className="text-amber-700 underline underline-offset-4 dark:text-amber-300">
              {privacyLabel}
            </Link>
            <a
              href="mailto:privacy@profiley.ai"
              className="text-amber-700 underline underline-offset-4 dark:text-amber-300"
            >
              {concernsLabel}
            </a>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function PublicProfilePage() {
  const { t } = useLanguage();
  const { username } = useParams();
  useDocumentTitle(username ? `${username} — ${t('publicProfile.title')}` : t('publicProfile.title'));
  const [activeTab, setActiveTab] = useState('about');
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);

  // Job fit
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [jobFitResult, setJobFitResult] = useState<any>(null);

  // Contact
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const [captchaWidgetId, setCaptchaWidgetId] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);

  // Load profile.
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = (await api.getPublicProfile(username)) as PublicProfile;
        if (cancelled) return;
        setProfile(data);
        // Load public skills (onboarding answers tagged public).
        const { data: skillsRow } = await supabase
          .from('knowledge_chunks')
          .select('content')
          .eq('user_id', data.user_id)
          .eq('source_kind', 'onboarding')
          .contains('metadata', { public: true } as any)
          .limit(100);
        // Best-effort: pull "skills:" line from onboarding chunks.
        if (!cancelled && Array.isArray(skillsRow)) {
          const acc: string[] = [];
          for (const r of skillsRow) {
            const c = String((r as any).content ?? '');
            if (/^skills:/i.test(c)) {
              const rest = c.replace(/^skills:\s*/i, '').trim();
              acc.push(...rest.split(',').map((s) => s.trim()).filter(Boolean));
            }
          }
          if (acc.length) setSkills(Array.from(new Set(acc)).slice(0, 16));
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.code === 'PROFILE_NOT_FOUND') {
          setError(t('publicProfile.error.notFound'));
        } else {
          setError(e instanceof ApiError ? e.message : t('publicProfile.error.notFound'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Track tab views.
  const handleTabChange = (next: string) => {
    setActiveTab(next);
    if (profile) {
      void api
        .trackRecruiterEvent({
          slug: profile.slug,
          eventName: 'tab_view',
          payload: { tab: next },
        })
        .catch(() => undefined);
    }
  };

  // Load hCaptcha script lazily when contact form is opened.
  useEffect(() => {
    if (!showContact || !CAPTCHA_SITE_KEY) return;
    const SCRIPT_ID = 'hcaptcha-script';
    const ensureWidget = () => {
      if (!window.hcaptcha || !captchaRef.current || captchaWidgetId) return;
      const id = window.hcaptcha.render(captchaRef.current, { sitekey: CAPTCHA_SITE_KEY });
      setCaptchaWidgetId(id);
    };
    if (window.hcaptcha) {
      ensureWidget();
      return;
    }
    if (document.getElementById(SCRIPT_ID)) {
      const t = setInterval(() => {
        if (window.hcaptcha) {
          ensureWidget();
          clearInterval(t);
        }
      }, 200);
      return () => clearInterval(t);
    }
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = 'https://js.hcaptcha.com/1/api.js';
    s.async = true;
    s.defer = true;
    s.onload = ensureWidget;
    document.body.appendChild(s);
  }, [showContact, captchaWidgetId]);

  const handleAnalyze = async () => {
    if (!profile) return;
    setAnalyzing(true);
    setJobFitResult(null);
    try {
      const r = await api.analyzeJobFit({
        slug: profile.slug,
        jobDescription,
        jobTitle: jobTitle || undefined,
        companyName: companyName || undefined,
      });
      setJobFitResult(r);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('publicProfile.feedback.analysisFailed');
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContact = async () => {
    if (!profile) return;
    if (contactMessage.trim().length < 10) {
      toast.error(t('publicProfile.contact.messageTooShort'));
      return;
    }
    let captchaToken: string | undefined;
    if (CAPTCHA_SITE_KEY && window.hcaptcha && captchaWidgetId) {
      try {
        captchaToken = window.hcaptcha.getResponse(captchaWidgetId) || undefined;
      } catch {
        /* noop */
      }
      if (!captchaToken) {
        toast.error(t('publicProfile.contact.captcha'));
        return;
      }
    }
    setContactSending(true);
    try {
      await api.submitRecruiterContact({
        slug: profile.slug,
        visitorName: contactName,
        visitorEmail: contactEmail,
        company: contactCompany || undefined,
        message: contactMessage,
        captchaToken,
      });
      toast.success(t('publicProfile.feedback.messageSent'));
      setContactName('');
      setContactEmail('');
      setContactCompany('');
      setContactMessage('');
      setShowContact(false);
      if (window.hcaptcha && captchaWidgetId) {
        try {
          window.hcaptcha.reset(captchaWidgetId);
        } catch {
          /* noop */
        }
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('publicProfile.feedback.sendFailed');
      toast.error(msg);
    } finally {
      setContactSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <div><Loader2 className="h-6 w-6 animate-spin mr-2 inline" /> {t('publicProfile.loading')}</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <CardTitle>{t('publicProfile.error.title')}</CardTitle>
            </div>
            <CardDescription>{error ?? t('publicProfile.error.notFound')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button variant="outline">{t('publicProfile.error.back')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile.full_name ?? profile.slug;
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const firstName = displayName.split(' ')[0] ?? displayName;

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-purple-500/5">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-screen-xl">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="font-bold text-white">P</span>
            </div>
            <span className="font-semibold hidden sm:inline-block">{t('publicProfile.brand')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              {t('publicProfile.verified')}
            </Badge>
            <Link to="/login">
              <Button variant="outline" size="sm">
                {t('publicProfile.createCta')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-border/40 bg-gradient-to-b from-purple-500/5 to-transparent">
        <div className="container mx-auto px-4 py-12 max-w-screen-xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              {profile.photoUrl ? (
                <AvatarImage src={profile.photoUrl} alt={displayName} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{displayName}</h1>
                {profile.headline && (
                  <p className="text-lg text-muted-foreground mt-1">{profile.headline}</p>
                )}
                {profile.current_location && (
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.current_location}</span>
                  </div>
                )}
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 6).map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
              {profile.allow_contact_form && (
                <div className="flex gap-2">
                  <Button className="gap-2" onClick={() => setShowContact((v) => !v)}>
                    <Mail className="h-4 w-4" />
                    {t('publicProfile.contact.send')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showContact && profile.allow_contact_form && (
        <section className="container mx-auto px-4 max-w-screen-xl pt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('publicProfile.contact.title')}</CardTitle>
              <CardDescription>{t('publicProfile.contact.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder={t('publicProfile.contact.name')}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder={t('publicProfile.contact.email')}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <Input
                placeholder={t('publicProfile.contact.company')}
                value={contactCompany}
                onChange={(e) => setContactCompany(e.target.value)}
              />
              <Textarea
                placeholder={t('publicProfile.contact.message')}
                rows={5}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {contactMessage.trim().length < 10
                  ? t('publicProfile.contact.messageHint', { count: 10 - contactMessage.trim().length })
                  : '\u00a0'}
              </p>
              {CAPTCHA_SITE_KEY && <div ref={captchaRef} />}
              <Button
                onClick={() => void handleContact()}
                disabled={
                  contactSending ||
                  !contactName.trim() ||
                  !contactEmail.trim() ||
                  contactMessage.trim().length < 10
                }
                className="gap-2"
              >
                {contactSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {t('publicProfile.contact.send')}
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="container mx-auto px-4 py-8 max-w-screen-xl">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="about">{t('publicProfile.tabs.about')}</TabsTrigger>
            <TabsTrigger value="chat" className="gap-2" disabled={!profile.allow_public_chat}>
              <MessageSquare className="h-4 w-4" />
              {t('publicProfile.tabs.chat')}
            </TabsTrigger>
            <TabsTrigger value="job-fit" className="gap-2" disabled={!profile.allow_job_fit_analysis}>
              <Briefcase className="h-4 w-4" />
              {t('publicProfile.tabs.jobFit')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6 mt-6">
            {(profile.short_bio || profile.long_bio) && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('publicProfile.about.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {profile.long_bio ?? profile.short_bio}
                  </p>
                </CardContent>
              </Card>
            )}
            {skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('publicProfile.about.skills')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-6 mt-6">
            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardHeader className="flex flex-row items-start gap-4">
                <Sparkles className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <CardTitle className="text-base">{t('publicProfile.chat.title', { firstName })}</CardTitle>
                  <CardDescription>
                    {t('publicProfile.chat.description', { firstName })}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <UsageNotice
              title={t('publicProfile.chat.notice.title')}
              body={t('publicProfile.chat.notice.body')}
              privacyLabel={t('publicProfile.aiLinks.privacy')}
              concernsLabel={t('publicProfile.aiLinks.concerns')}
            />

            <Card className="h-[600px] flex flex-col">
              <ChatInterface
                profileSlug={profile.slug}
                userName={t('publicProfile.chat.userName')}
                botName={`${firstName} AI`}
                profileName={displayName}
                botAvatar={profile.photoUrl || undefined}
                placeholder={t('publicProfile.chat.placeholder')}
              />
            </Card>
          </TabsContent>

          <TabsContent value="job-fit" className="space-y-6 mt-6">
            <Card className="border-purple-500/50 bg-purple-500/5">
              <CardHeader className="flex flex-row items-start gap-4">
                <Briefcase className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <CardTitle className="text-base">{t('publicProfile.jobFit.title')}</CardTitle>
                  <CardDescription>
                    {t('publicProfile.jobFit.description', { firstName })}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <UsageNotice
              title={t('publicProfile.jobFit.notice.title')}
              body={t('publicProfile.jobFit.notice.body')}
              privacyLabel={t('publicProfile.aiLinks.privacy')}
              concernsLabel={t('publicProfile.aiLinks.concerns')}
            />

            <Card>
              <CardHeader>
                <CardTitle>{t('publicProfile.jobFit.input')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder={t('publicProfile.jobFit.jobTitle')}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                  <Input
                    placeholder={t('publicProfile.jobFit.company')}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder={t('publicProfile.jobFit.placeholder')}
                  rows={12}
                  className="font-mono text-sm"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <Button
                  className="gap-2"
                  onClick={() => void handleAnalyze()}
                  disabled={!jobDescription.trim() || analyzing}
                >
                  {analyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {analyzing ? t('publicProfile.jobFit.analyzing') : t('publicProfile.jobFit.analyze')}
                </Button>
              </CardContent>
            </Card>

            {jobFitResult && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('publicProfile.jobFit.fitScore', { score: jobFitResult.fitScore, band: jobFitResult.fitBand })}
                  </CardTitle>
                  <CardDescription>{jobFitResult.reasoningSummary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {Array.isArray(jobFitResult.strengths) && jobFitResult.strengths.length > 0 && (
                    <div>
                      <p className="font-medium mb-1 text-green-400">{t('publicProfile.jobFit.strengths')}</p>
                      <ul className="list-disc ml-5 space-y-1">
                        {jobFitResult.strengths.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(jobFitResult.gaps) && jobFitResult.gaps.length > 0 && (
                    <div>
                      <p className="font-medium mb-1 text-orange-400">{t('publicProfile.jobFit.gaps')}</p>
                      <ul className="list-disc ml-5 space-y-1">
                        {jobFitResult.gaps.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(jobFitResult.transferableStrengths) &&
                    jobFitResult.transferableStrengths.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-blue-400">{t('publicProfile.jobFit.transferable')}</p>
                        <ul className="list-disc ml-5 space-y-1">
                          {jobFitResult.transferableStrengths.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
