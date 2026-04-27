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

const STEPS = ['Welcome', 'Profile Basics', 'Professional Info', 'Preferences', 'Complete'];

export default function OnboardingPage() {
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
      toast.success('Onboarding saved');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Save failed';
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
          <h1 className="text-2xl font-bold">Create Your AI Profile</h1>
          <p className="text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
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
                  <h2 className="text-xl font-semibold">Welcome to Profiley!</h2>
                  <p className="text-muted-foreground">
                    Let's set up your AI-powered professional profile. This will only take a few minutes.
                  </p>
                </div>
                <div className="grid gap-4 text-left">
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <h3 className="font-medium mb-1">What you'll do:</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Set up your basic profile information</li>
                      <li>• Define your professional strengths and goals</li>
                      <li>• Configure language and timezone preferences</li>
                      <li>• Upload your CV and supporting documents</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your data is captured from your browser: <br />
                  <strong>Locale:</strong> {navigator.language} | <strong>Timezone:</strong>{' '}
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
            )}

            {/* Step 1: Profile Basics */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Profile Basics</CardTitle>
                  <CardDescription>Tell us about yourself</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Akram Fares"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headline">Professional Headline</Label>
                  <Input
                    id="headline"
                    placeholder="Senior Software Engineer | AI & Cloud Architecture"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Short Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell recruiters about your background and what makes you unique..."
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="San Francisco, CA"
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
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>Help AI understand your expertise</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label htmlFor="strengths">Key Strengths</Label>
                  <div className="flex gap-2">
                    <Input
                      id="strengths"
                      placeholder="Add a strength (e.g., Full-Stack Development)"
                      value={strengthInput}
                      onChange={(e) => setStrengthInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStrength())}
                    />
                    <Button type="button" onClick={addStrength}>
                      Add
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
                  <Label htmlFor="seniority">Seniority Level</Label>
                  <Select
                    value={formData.seniority}
                    onValueChange={(value) => setFormData({ ...formData, seniority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select seniority level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid-Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                      <SelectItem value="staff">Staff/Principal (10+ years)</SelectItem>
                      <SelectItem value="lead">Lead/Manager</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingStyle">Working Style</Label>
                  <Textarea
                    id="workingStyle"
                    placeholder="Describe how you prefer to work (remote, hybrid, collaborative, etc.)"
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
                  <CardTitle>Language & Regional Preferences</CardTitle>
                  <CardDescription>Configure how your AI persona interacts</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label htmlFor="preferredLanguage">Preferred Language</Label>
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
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input value={formData.timezone} disabled />
                  <p className="text-xs text-muted-foreground">
                    Automatically detected from your browser
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Browser Locale</Label>
                  <Input value={navigator.language} disabled />
                  <p className="text-xs text-muted-foreground">
                    Automatically detected from your browser
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
                  <h2 className="text-xl font-semibold">Profile Created!</h2>
                  <p className="text-muted-foreground">
                    Your basic profile is set up. Next, upload your CV and documents to complete your
                    AI knowledge base.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-left">
                  <h3 className="font-medium mb-2">Next Steps:</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Upload your CV and portfolio documents</li>
                    <li>• Review your public profile page</li>
                    <li>• Test your AI persona in chat preview</li>
                    <li>• Share your profile link with recruiters</li>
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
            Previous
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={() => void nextStep()} disabled={submitting} className="gap-2">
              {submitting && currentStep === STEPS.length - 2 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {currentStep === STEPS.length - 2 ? 'Finish & Continue' : 'Next'}
            </Button>
          ) : (
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          )}
        </div>
      </div>
    </div>
  );
}
