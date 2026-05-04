import { useMemo, useState } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { api, ApiError } from '../../lib/api';
import type { AppUserRow, ProfileRow } from '../../lib/profile';
import { useLanguage } from '../contexts/language-context';

type Props = {
  appUser: AppUserRow | null;
  profile: ProfileRow | null;
  reload: () => Promise<unknown>;
};

export function AccountDeletionCard({ appUser, profile, reload }: Props) {
  const { t, language } = useLanguage();
  const [confirmationText, setConfirmationText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const scheduledFor = appUser?.deletion_scheduled_for ?? null;
  const pendingDeletion = Boolean(scheduledFor);
  const scheduledLabel = useMemo(() => {
    if (!scheduledFor) return null;
    return new Intl.DateTimeFormat(language, {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(scheduledFor));
  }, [language, scheduledFor]);

  const requestDeletion = async () => {
    if (confirmationText !== 'DELETE') {
      toast.error(t('settings.accountDeletion.feedback.confirmationRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await api.requestAccountDeletion({
        confirmationText: 'DELETE',
        requestSource: 'settings',
      });
      setConfirmationText('');
      await reload();
      toast.success(t('settings.accountDeletion.feedback.scheduled'));
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : t('settings.accountDeletion.feedback.failed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelDeletion = async () => {
    setSubmitting(true);
    try {
      await api.cancelAccountDeletion();
      await reload();
      toast.success(t('settings.accountDeletion.feedback.cancelled'));
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : t('settings.accountDeletion.feedback.cancelFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">{t('settings.accountDeletion.title')}</CardTitle>
        <CardDescription>{t('settings.accountDeletion.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-medium text-destructive">
            <TriangleAlert className="h-4 w-4" />
            {t('settings.accountDeletion.warningTitle')}
          </div>
          <p>{t('settings.accountDeletion.warningBody')}</p>
        </div>

        {pendingDeletion ? (
          <div className="space-y-4 rounded-lg border border-border/60 p-4">
            <div className="space-y-2">
              <p className="font-medium">{t('settings.accountDeletion.pendingTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('settings.accountDeletion.pendingDescription')}
              </p>
              <p className="text-sm font-medium text-foreground">
                {t('settings.accountDeletion.scheduledFor', { date: scheduledLabel ?? '' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {profile?.public_visibility
                  ? t('settings.accountDeletion.publicHiddenPending')
                  : t('settings.accountDeletion.publicHiddenNote')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void cancelDeletion();
              }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('settings.accountDeletion.cancelling')}
                </>
              ) : (
                t('settings.accountDeletion.cancelButton')
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-border/60 p-4">
            <div className="space-y-2">
              <Label htmlFor="deletion-confirmation">
                {t('settings.accountDeletion.confirmLabel')}
              </Label>
              <Input
                id="deletion-confirmation"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                placeholder={t('settings.accountDeletion.confirmPlaceholder')}
                autoComplete="off"
                aria-describedby="deletion-confirmation-hint"
              />
              <p id="deletion-confirmation-hint" className="text-sm text-muted-foreground">
                {t('settings.accountDeletion.confirmHint')}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                void requestDeletion();
              }}
              disabled={submitting || confirmationText !== 'DELETE'}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('settings.accountDeletion.requesting')}
                </>
              ) : (
                t('settings.accountDeletion.requestButton')
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}