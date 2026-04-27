import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/language-context';

export default function OnboardingPage() {
  const { t } = useLanguage();
  const STEPS = [
    t('onboarding.steps.welcome'),
    t('onboarding.steps.basics'),
    t('onboarding.steps.professional'),
    t('onboarding.steps.preferences'),
    t('onboarding.steps.complete'),
  ];
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    headline: '',
    bio: '',
    location: '',
    preferredLanguage: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    strengths: [] as string[],
    preferredRoles: [] as string[],
    industries: [] as string[],
    seniority: '',
    workingStyle: '',
  });

  const [strengthInput, setStrengthInput] = useState('');

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const addStrength = () => {
    if (strengthInput.trim()) {
      setFormData({ ...formData, strengths: [...formData.strengths, strengthInput.trim()] });
      setStrengthInput('');
    }
  };

  const removeStrength = (index: number) => {
    setFormData({
      ...formData,
      strengths: formData.strengths.filter((_, i) => i !== index),
    });
  };

  // Initialize an app_users row for newly authenticated users (idempotent).
  useEffect(() => {
    void api
      .initializeUserProfile({
        browserLocale: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferredLanguage: formData.preferredLanguage,
      })
      .catch(() => {
        /* non-fatal: user may already exist or be unauthenticated */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitOnboarding = async () => {
    if (submitted) return;
    setSubmitting(true);
    try {
      const answers = [
        formData.strengths.length
          ? { questionKey: 'strengths', answerJson: formData.strengths }
          : null,
        formData.preferredRoles.length
          ? { questionKey: 'preferred_roles', answerJson: formData.preferredRoles }
          : null,
        formData.industries.length
          ? { questionKey: 'industries', answerJson: formData.industries }
          : null,
        formData.seniority ? { questionKey: 'seniority', answerText: formData.seniority } : null,
        formData.workingStyle
          ? { questionKey: 'working_style', answerText: formData.workingStyle }
          : null,
      ].filter(Boolean) as Array<{
        questionKey: string;
        answerText?: string;
        answerJson?: unknown;
      }>;
      await api.completeOnboarding({
        answers,
        profile: {
          fullName: formData.fullName || undefined,
          headline: formData.headline || undefined,
          shortBio: formData.bio || undefined,
          currentLocation: formData.location || undefined,
          preferredLanguage: formData.preferredLanguage,
          timezone: formData.timezone,
        },
      });
      setSubmitted(true);
      toast.success(t('onboarding.feedback.saved'));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('onboarding.feedback.saveFailed');
      toast.error(msg);
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === STEPS.length - 2) {
      try {
        await submitOnboarding();
      } catch {
        return;
      }
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">P</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold">{t('onboarding.title')}</h1>
          <p className="text-muted-foreground">
            {t('onboarding.stepLabel', { step: currentStep + 1, total: STEPS.length, stepName: STEPS[currentStep] })}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map((step, i) => (
              <span key={step} className={i === currentStep ? 'text-foreground font-medium' : ''}>
                {step}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <div className="space-y-6 text-center">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">{t('onboarding.welcome.title')}</h2>
                  <p className="text-muted-foreground">
                    {t('onboarding.welcome.intro')}
                  </p>
                </div>
                <div className="grid gap-4 text-left">
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <h3 className="font-medium mb-1">{t('onboarding.welcome.youWillDo')}</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {t('onboarding.welcome.items.basics')}</li>
                      <li>• {t('onboarding.welcome.items.professional')}</li>
                      <li>• {t('onboarding.welcome.items.preferences')}</li>
                      <li>• {t('onboarding.welcome.items.documents')}</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.welcome.captured')} <br />
                  <strong>{t('onboarding.welcome.locale')}</strong> {navigator.language} | <strong>{t('onboarding.welcome.timezone')}</strong>{' '}
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
            )}

            {/* Step 1: Profile Basics */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>{t('onboarding.basics.title')}</CardTitle>
                  <CardDescription>{t('onboarding.basics.description')}</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('onboarding.basics.fullName')}</Label>
                  <Input
                    id="fullName"
                    placeholder={t('onboarding.basics.fullNamePlaceholder')}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headline">{t('onboarding.basics.headline')}</Label>
                  <Input
                    id="headline"
                    placeholder={t('onboarding.basics.headlinePlaceholder')}
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">{t('onboarding.basics.bio')}</Label>
                  <Textarea
                    id="bio"
                    placeholder={t('onboarding.basics.bioPlaceholder')}
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t('onboarding.basics.location')}</Label>
                  <Input
                    id="location"
                    placeholder={t('onboarding.basics.locationPlaceholder')}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Professional Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>{t('onboarding.professional.title')}</CardTitle>
                  <CardDescription>{t('onboarding.professional.description')}</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label htmlFor="strengths">{t('onboarding.professional.strengths')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="strengths"
                      placeholder={t('onboarding.professional.strengthsPlaceholder')}
                      value={strengthInput}
                      onChange={(e) => setStrengthInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStrength())}
                    />
                    <Button type="button" onClick={addStrength}>
                      {t('onboarding.professional.add')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.strengths.map((strength, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {strength}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeStrength(i)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seniority">{t('onboarding.professional.seniority')}</Label>
                  <Select
                    value={formData.seniority}
                    onValueChange={(value) => setFormData({ ...formData, seniority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('onboarding.professional.seniorityPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">{t('onboarding.professional.seniorityLevels.junior')}</SelectItem>
                      <SelectItem value="mid">{t('onboarding.professional.seniorityLevels.mid')}</SelectItem>
                      <SelectItem value="senior">{t('onboarding.professional.seniorityLevels.senior')}</SelectItem>
                      <SelectItem value="staff">{t('onboarding.professional.seniorityLevels.staff')}</SelectItem>
                      <SelectItem value="lead">{t('onboarding.professional.seniorityLevels.lead')}</SelectItem>
                      <SelectItem value="executive">{t('onboarding.professional.seniorityLevels.executive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingStyle">{t('onboarding.professional.workingStyle')}</Label>
                  <Textarea
                    id="workingStyle"
                    placeholder={t('onboarding.professional.workingStylePlaceholder')}
                    rows={3}
                    value={formData.workingStyle}
                    onChange={(e) => setFormData({ ...formData, workingStyle: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>{t('onboarding.preferences.title')}</CardTitle>
                  <CardDescription>{t('onboarding.preferences.description')}</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label htmlFor="preferredLanguage">{t('onboarding.preferences.language')}</Label>
                  <Select
                    value={formData.preferredLanguage}
                    onValueChange={(value) =>
                      setFormData({ ...formData, preferredLanguage: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="nl">Nederlands</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('onboarding.preferences.timezone')}</Label>
                  <Input value={formData.timezone} disabled />
                  <p className="text-xs text-muted-foreground">
                    {t('onboarding.preferences.timezoneAuto')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{t('onboarding.preferences.browserLocale')}</Label>
                  <Input value={navigator.language} disabled />
                  <p className="text-xs text-muted-foreground">
                    {t('onboarding.preferences.timezoneAuto')}
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <div className="space-y-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
                  <svg
                    className="w-8 h-8 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">{t('onboarding.complete.title')}</h2>
                  <p className="text-muted-foreground">
                    {t('onboarding.complete.description')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-left">
                  <h3 className="font-medium mb-2">{t('onboarding.complete.nextSteps')}</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• {t('onboarding.complete.items.upload')}</li>
                    <li>• {t('onboarding.complete.items.review')}</li>
                    <li>• {t('onboarding.complete.items.test')}</li>
                    <li>• {t('onboarding.complete.items.share')}</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            {t('onboarding.nav.previous')}
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={() => void nextStep()} disabled={submitting} className="gap-2">
              {submitting && currentStep === STEPS.length - 2 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {currentStep === STEPS.length - 2 ? t('onboarding.nav.finish') : t('onboarding.nav.next')}
            </Button>
          ) : (
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          )}
        </div>
      </div>
    </div>
  );
}
