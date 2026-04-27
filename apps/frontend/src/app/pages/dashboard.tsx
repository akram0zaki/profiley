import { AppLayout } from '../components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router';
import { useLanguage } from '../contexts/language-context';
import {
  Users,
  MessageSquare,
  Briefcase,
  TrendingUp,
  Eye,
  CheckCircle2,
  AlertCircle,
  Upload,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCurrentProfile } from '../../lib/profile';
import { supabase } from '../../lib/supabase';

type ActivityRow = {
  id: string;
  event_name: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

const PROFILE_FIELDS: Array<keyof Record<string, unknown>> = [
  'full_name',
  'headline',
  'short_bio',
  'long_bio',
  'current_location',
  'profile_photo_path',
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const { appUser, profile, loading } = useCurrentProfile();
  const [stats, setStats] = useState({
    visits: 0,
    conversations: 0,
    jobFits: 0,
    documents: 0,
    chunks: 0,
    completedDocs: 0,
  });
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!appUser || !profile) return;
    let cancelled = false;
    void (async () => {
      setStatsLoading(true);
      const profileId = profile.id;
      const userId = appUser.id;
      const [
        visitsRes,
        convosRes,
        fitsRes,
        docsRes,
        completedDocsRes,
        chunksRes,
        eventsRes,
      ] = await Promise.all([
        supabase
          .from('recruiter_visits')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId),
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId),
        supabase
          .from('job_fit_analyses')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId),
        supabase
          .from('uploaded_documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('uploaded_documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('processing_status', 'completed'),
        supabase
          .from('knowledge_chunks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .is('deleted_at', null),
        supabase
          .from('recruiter_events')
          .select('id, event_name, payload, created_at')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      if (cancelled) return;
      setStats({
        visits: visitsRes.count ?? 0,
        conversations: convosRes.count ?? 0,
        jobFits: fitsRes.count ?? 0,
        documents: docsRes.count ?? 0,
        completedDocs: completedDocsRes.count ?? 0,
        chunks: chunksRes.count ?? 0,
      });
      setActivity((eventsRes.data ?? []) as ActivityRow[]);
      setStatsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [appUser, profile]);

  const profileCompletion = profile
    ? Math.round(
        (PROFILE_FIELDS.filter((f) => Boolean((profile as any)[f])).length / PROFILE_FIELDS.length) *
          100,
      )
    : 0;

  const docProgress = stats.documents
    ? Math.round((stats.completedDocs / stats.documents) * 100)
    : 0;

  const firstName = profile?.full_name?.split(' ')[0] ?? appUser?.email?.split('@')[0] ?? 'there';

  const formatRelative = (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const m = Math.round(diffMs / 60000);
    if (m < 1) return t('dashboard.time.justNow');
    if (m < 60) return t('dashboard.time.minutesAgo', { count: m });
    const h = Math.round(m / 60);
    if (h < 24) return t('dashboard.time.hoursAgo', { count: h });
    const d = Math.round(h / 24);
    return t('dashboard.time.daysAgo', {
      count: d,
      unit: d > 1 ? t('dashboard.time.daysUnit') : t('dashboard.time.dayUnit'),
    });
  };

  const eventLabel = (e: string) => {
    if (e === 'profile_view') return t('dashboard.activity.viewed');
    if (e === 'chat_started' || e === 'chat_message') return t('dashboard.activity.chatted');
    if (e === 'job_fit_run' || e === 'job_fit_analyze') return t('dashboard.activity.jobFit');
    if (e === 'tab_view') return t('dashboard.activity.viewed');
    return e;
  };

  const eventIcon = (e: string) => {
    if (e.startsWith('chat')) return <MessageSquare className="h-5 w-5 text-purple-400" />;
    if (e.startsWith('job_fit')) return <Briefcase className="h-5 w-5 text-cyan-400" />;
    return <Eye className="h-5 w-5 text-blue-400" />;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">
              {t('dashboard.subtitle', { name: firstName })}
            </p>
          </div>
          {profile?.slug && (
            <Link to={`/public/${profile.slug}`} target="_blank" rel="noreferrer">
              <Button className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {t('dashboard.viewPublicProfile')}
              </Button>
            </Link>
          )}
        </div>

        {!loading && profileCompletion < 100 && (
          <Card className="border-blue-500/50 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-medium">{t('dashboard.completeProfile')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.profileProgress', { percent: profileCompletion })}
                    </p>
                  </div>
                  <Progress value={profileCompletion} className="h-2" />
                  <Link to="/uploads">
                    <Button size="sm" className="gap-2">
                      <Upload className="h-4 w-4" />
                      {t('dashboard.uploadDocuments')}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.profileViews')}</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.visits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.stats.allTime')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.conversations')}</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.stats.totalChatSessions')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.stats.jobFitAnalyses')}
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.jobFits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.stats.analysesRun')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.stats.engagementRate')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.visits
                  ? Math.round(
                      ((stats.conversations + stats.jobFits) / stats.visits) * 100,
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.stats.visitsToAction')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
              <CardDescription>{t('dashboard.activitySubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('dashboard.loading')}
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {t('dashboard.activity.empty')}
                </p>
              ) : (
                <div className="space-y-4">
                  {activity.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                        {eventIcon(a.event_name)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {(a.payload as any)?.tab
                            ? `Tab: ${(a.payload as any).tab}`
                            : a.event_name.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatRelative(a.created_at)}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {eventLabel(a.event_name)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.quickActions')}</CardTitle>
              <CardDescription>{t('dashboard.quickActionsSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/profile" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  {t('dashboard.action.editProfile')}
                </Button>
              </Link>
              <Link to="/uploads" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Upload className="h-4 w-4" />
                  {t('dashboard.action.uploadDocs')}
                </Button>
              </Link>
              <Link to="/chat-preview" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('dashboard.action.testPersona')}
                </Button>
              </Link>
              <Link to="/job-fit-preview" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Briefcase className="h-4 w-4" />
                  {t('dashboard.action.testJobFit')}
                </Button>
              </Link>
              <Link to="/settings" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('dashboard.action.configureAI')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.knowledgeBase')}</CardTitle>
            <CardDescription>{t('dashboard.knowledgeBaseSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('dashboard.kb.documents')}
                  </span>
                  <span className="text-sm font-medium">{stats.documents}</span>
                </div>
                <Progress
                  value={Math.min(100, stats.documents * 10)}
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('dashboard.kb.chunks')}
                  </span>
                  <span className="text-sm font-medium">{stats.chunks}</span>
                </div>
                <Progress value={Math.min(100, stats.chunks)} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('dashboard.kb.processing')}
                  </span>
                  <span className="text-sm font-medium text-green-400">
                    {docProgress === 100
                      ? t('dashboard.kb.complete')
                      : `${docProgress}%`}
                  </span>
                </div>
                <Progress value={docProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
