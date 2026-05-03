import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { api, ApiError } from '../../lib/api';
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
  hasAcceptedCurrentLegalVersions,
} from '../../lib/legal';
import { useCurrentProfile } from '../../lib/profile';
import { useLanguage } from '../contexts/language-context';

export default function LegalAcceptancePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { appUser, loading, reload } = useCurrentProfile();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = searchParams.get('redirect') ?? '/dashboard';
  const requiresTermsAcceptance = !appUser?.terms_accepted_at || appUser.terms_version !== CURRENT_TERMS_VERSION;
  const requiresPrivacyAcceptance =
    !appUser?.privacy_accepted_at || appUser.privacy_version !== CURRENT_PRIVACY_VERSION;

  useEffect(() => {
    if (loading) return;
    if (hasAcceptedCurrentLegalVersions(appUser)) {
      navigate(redirectTo, { replace: true });
    }
  }, [appUser, loading, navigate, redirectTo]);

  const handleSubmit = async () => {
    if ((requiresTermsAcceptance && !termsAccepted) || (requiresPrivacyAcceptance && !privacyAccepted)) {
      toast.error(t('legal.acceptance.required'));
      return;
    }

    setSubmitting(true);
    try {
      await api.acceptLegalDocuments({
        termsAccepted: true,
        privacyAccepted: true,
        acceptanceSource: 'in_app_gate',
      });
      await reload();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('legal.acceptance.failed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {t('legal.acceptance.loading')}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-purple-500/5 p-4">
      <Card className="w-full max-w-2xl border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="space-y-3">
          <CardTitle>{t('legal.acceptance.title')}</CardTitle>
          <CardDescription>{t('legal.acceptance.lead')}</CardDescription>
          <p className="text-sm text-muted-foreground">
            {t('legal.acceptance.versionNotice', {
              termsVersion: CURRENT_TERMS_VERSION,
              privacyVersion: CURRENT_PRIVACY_VERSION,
            })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
            {t('legal.acceptance.description')}
          </div>

          <div className="space-y-4">
            {requiresTermsAcceptance ? (
              <div className="flex items-start gap-3 rounded-lg border border-border/60 p-4">
                <Checkbox
                  id="terms-acceptance"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
                />
                <div className="space-y-2">
                  <Label htmlFor="terms-acceptance" className="leading-6">
                    {t('legal.acceptance.termsLabel', { version: CURRENT_TERMS_VERSION })}
                  </Label>
                  <a
                    href="/legal/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline underline-offset-4 hover:text-foreground"
                  >
                    {t('legal.acceptance.links.terms')}
                  </a>
                </div>
              </div>
            ) : null}

            {requiresPrivacyAcceptance ? (
              <div className="flex items-start gap-3 rounded-lg border border-border/60 p-4">
                <Checkbox
                  id="privacy-acceptance"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(Boolean(checked))}
                />
                <div className="space-y-2">
                  <Label htmlFor="privacy-acceptance" className="leading-6">
                    {t('legal.acceptance.privacyLabel', { version: CURRENT_PRIVACY_VERSION })}
                  </Label>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <a
                      href="/legal/privacy"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      {t('legal.acceptance.links.privacy')}
                    </a>
                    <a
                      href="/legal/cookies"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      {t('legal.acceptance.links.cookies')}
                    </a>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
            {t('legal.acceptance.help')}
          </div>

          <Button
            className="w-full"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={
              submitting ||
              (requiresTermsAcceptance && !termsAccepted) ||
              (requiresPrivacyAcceptance && !privacyAccepted)
            }
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('legal.acceptance.submitting')}
              </>
            ) : (
              t('legal.acceptance.submit')
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}