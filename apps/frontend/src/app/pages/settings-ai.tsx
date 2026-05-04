import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router';
import { ArrowLeft, Bot, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth';
import { useCurrentProfile, updatePreferences } from '../../lib/profile';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../contexts/language-context';
import { useDocumentTitle } from '../hooks/use-document-title';

type ProviderConfig = {
  id: string;
  capability: string;
  provider: string;
  model_key: string;
  display_name: string | null;
  is_active: boolean;
  is_default: boolean;
};

type FeatureAssignment = {
  feature_key: string;
  capability: string;
  provider_config_id: string | null;
};

const TONE_OPTIONS = [
  { value: 'professional', labelKey: 'settingsAi.tone.options.professional' },
  { value: 'friendly', labelKey: 'settingsAi.tone.options.friendly' },
  { value: 'technical', labelKey: 'settingsAi.tone.options.technical' },
  { value: 'concise', labelKey: 'settingsAi.tone.options.concise' },
];

export default function SettingsAIPage() {
  const { t } = useLanguage();
  useDocumentTitle(t('settingsAi.title'));
  const auth = useAuth();
  const { appUser, preferences, loading: profileLoading, reload } = useCurrentProfile();
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [assignments, setAssignments] = useState<FeatureAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tone, setTone] = useState('professional');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences?.ai_persona_tone) setTone(preferences.ai_persona_tone);
  }, [preferences]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [{ data: cfgs }, { data: asg }] = await Promise.all([
        supabase
          .from('ai_provider_configs')
          .select('id, capability, provider, model_key, display_name, is_active, is_default')
          .eq('is_active', true)
          .order('capability')
          .order('is_default', { ascending: false }),
        supabase
          .from('feature_model_assignments')
          .select('feature_key, capability, provider_config_id'),
      ]);
      if (cancelled) return;
      setConfigs((cfgs ?? []) as ProviderConfig[]);
      setAssignments((asg ?? []) as FeatureAssignment[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveTone = async () => {
    if (!appUser) return;
    setSaving(true);
    try {
      await updatePreferences(appUser.id, { ai_persona_tone: tone });
      toast.success(t('settingsAi.feedback.toneSaved'));
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const grouped: Record<string, ProviderConfig[]> = {};
  for (const c of configs) {
    if (!grouped[c.capability]) grouped[c.capability] = [];
    grouped[c.capability].push(c);
  }

  const featureGrouped: Record<string, FeatureAssignment[]> = {};
  for (const a of assignments) {
    if (!featureGrouped[a.capability]) featureGrouped[a.capability] = [];
    featureGrouped[a.capability].push(a);
  }

  const isAdmin = auth.role === 'admin';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t('settingsAi.title')}</h1>
            <p className="text-muted-foreground">{t('settingsAi.subtitle')}</p>
          </div>
        </div>

        <Card className="border-blue-500/40 bg-blue-500/5">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {t('settingsAi.info')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settingsAi.tone.title')}</CardTitle>
            <CardDescription>{t('settingsAi.tone.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personaTone">{t('settingsAi.tone.label')}</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="personaTone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin ? (
              <div className="space-y-2">
                <Label>{t('settingsAi.customPrompt.title')}</Label>
                <Textarea
                  rows={5}
                  placeholder={t('settingsAi.customPrompt.comingSoon')}
                  className="font-mono text-sm"
                  disabled
                />
                <p className="text-xs text-muted-foreground">{t('settingsAi.customPrompt.disabled')}</p>
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button
                onClick={() => void handleSaveTone()}
                disabled={saving || profileLoading}
                className="gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('settingsAi.tone.save')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-400" />
                <CardTitle>{t('settingsAi.activeModels.title')}</CardTitle>
              </div>
              <CardDescription>{t('settingsAi.activeModels.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('settingsAi.activeModels.loading')}
                </div>
              ) : configs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('settingsAi.activeModels.empty')}</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([capability, items]) => (
                    <div key={capability} className="space-y-2">
                      <h3 className="font-medium capitalize">{capability}</h3>
                      <div className="space-y-2">
                        {items.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div>
                              <p className="font-medium">{m.display_name ?? m.model_key}</p>
                              <p className="text-xs text-muted-foreground">
                                {m.provider} · {m.model_key}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {m.is_default && (
                                <Badge variant="secondary" className="text-xs">
                                  {t('settingsAi.activeModels.default')}
                                </Badge>
                              )}
                              {!m.is_active && (
                                <Badge variant="outline" className="text-xs">
                                  {t('settingsAi.activeModels.inactive')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{t('settingsAi.assignments.title')}</CardTitle>
            <CardDescription>{t('settingsAi.assignments.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('settingsAi.assignments.loading')}
              </div>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('settingsAi.assignments.empty')}</p>
            ) : (
              <div className="space-y-3 text-sm">
                {assignments.map((a) => {
                  const cfg = configs.find((c) => c.id === a.provider_config_id);
                  return (
                    <div
                      key={`${a.feature_key}-${a.capability}`}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{a.feature_key}</p>
                        <p className="text-xs text-muted-foreground capitalize">{a.capability}</p>
                      </div>
                      <p className="text-muted-foreground">
                        {cfg ? (cfg.display_name ?? cfg.model_key) : '— (using fallback)'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
