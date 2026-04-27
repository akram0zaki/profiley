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
} from 'lucide-react';

const mockActivities = [
  { id: 1, type: 'view', user: 'Sarah Chen', company: 'TechCorp', time: '2 hours ago' },
  { id: 2, type: 'chat', user: 'Michael Rodriguez', company: 'StartupX', time: '5 hours ago' },
  { id: 3, type: 'job-fit', user: 'Emma Wilson', company: 'BigTech Inc', time: '1 day ago' },
  { id: 4, type: 'view', user: 'David Kim', company: 'Innovation Labs', time: '2 days ago' },
  { id: 5, type: 'chat', user: 'Lisa Thompson', company: 'CloudSoft', time: '3 days ago' },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const profileCompletion = 75;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">
              {t('dashboard.subtitle').replace('{name}', 'Akram')}
            </p>
          </div>
          <Link to="/public/akram">
            <Button className="gap-2">
              <ExternalLink className="h-4 w-4" />
              {t('dashboard.viewPublicProfile')}
            </Button>
          </Link>
        </div>

        {/* Profile Completion Banner */}
        {profileCompletion < 100 && (
          <Card className="border-blue-500/50 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-medium">{t('dashboard.completeProfile')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.profileProgress').replace('{percent}', profileCompletion.toString())}
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

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.profileViews')}</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-400">+12%</span> {t('dashboard.stats.fromLastMonth')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.conversations')}</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">184</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-400">+23%</span> {t('dashboard.stats.fromLastMonth')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.jobFitAnalyses')}</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-400">+8%</span> {t('dashboard.stats.fromLastMonth')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.stats.engagementRate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">73%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-400">+5%</span> {t('dashboard.stats.fromLastMonth')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
              <CardDescription>{t('dashboard.activitySubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                      {activity.type === 'view' && <Eye className="h-5 w-5 text-blue-400" />}
                      {activity.type === 'chat' && <MessageSquare className="h-5 w-5 text-purple-400" />}
                      {activity.type === 'job-fit' && <Briefcase className="h-5 w-5 text-cyan-400" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.company}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.type === 'view' && t('dashboard.activity.viewed')}
                      {activity.type === 'chat' && t('dashboard.activity.chatted')}
                      {activity.type === 'job-fit' && t('dashboard.activity.jobFit')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
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

        {/* Knowledge Base Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.knowledgeBase')}</CardTitle>
            <CardDescription>{t('dashboard.knowledgeBaseSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('dashboard.kb.documents')}</span>
                  <span className="text-sm font-medium">8</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('dashboard.kb.chunks')}</span>
                  <span className="text-sm font-medium">342</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('dashboard.kb.processing')}</span>
                  <span className="text-sm font-medium text-green-400">{t('dashboard.kb.complete')}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
