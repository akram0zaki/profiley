import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Sparkles, Bot, Shield, Zap, Globe, Users, ArrowRight, Check, Languages, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useLanguage } from '../contexts/language-context';
import { useTheme } from '../components/theme-provider';
import { useDocumentTitle } from '../hooks/use-document-title';

const languages = [
  { code: 'en' as const, nativeName: 'English' },
  { code: 'nl' as const, nativeName: 'Nederlands' },
  { code: 'ar' as const, nativeName: 'العربية' },
];

export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  useDocumentTitle(t('landing.brand'));
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-purple-500/5">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-screen-xl">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">P</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {t('landing.brand')}
            </span>
          </div>
          <nav className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={t('a11y.toggleTheme')}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2" aria-label={t('a11y.selectLanguage')}>
                  <Languages className="h-4 w-4" />
                  <span className="text-sm hidden sm:inline">
                    {languages.find((l) => l.code === language)?.code.toUpperCase()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuLabel>{t('nav.language')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                  >
                    <span className="flex-1">{lang.nativeName}</span>
                    {language === lang.code && (
                      <Check className="h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/login">
              <Button variant="ghost">{t('landing.nav.signIn')}</Button>
            </Link>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                {t('landing.nav.getStarted')}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 max-w-screen-xl">
        <div className="flex flex-col items-center text-center gap-8">
          <Badge variant="secondary" className="gap-2 px-4 py-1">
            <Sparkles className="h-3 w-3" />
            {t('landing.hero.badge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold max-w-4xl leading-tight">
            {t('landing.hero.title')}{' '}
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t('landing.hero.titleHighlight')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            {t('landing.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white gap-2">
                {t('landing.hero.cta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/public/akram">
              <Button size="lg" variant="outline">
                {t('landing.hero.viewExample')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl" />
          <div className="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1770210217380-d78a69acdc77?q=80&w=2000&auto=format&fit=crop"
              alt={t('landing.imageAlt')}
              className="aspect-video rounded-lg object-cover w-full"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 max-w-screen-xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{t('landing.features.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle>{t('landing.feature.aiChat.title')}</CardTitle>
              <CardDescription>
                {t('landing.feature.aiChat.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle>{t('landing.feature.jobFit.title')}</CardTitle>
              <CardDescription>
                {t('landing.feature.jobFit.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-cyan-400" />
              </div>
              <CardTitle>{t('landing.feature.evidence.title')}</CardTitle>
              <CardDescription>
                {t('landing.feature.evidence.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle>{t('landing.feature.multilingual.title')}</CardTitle>
              <CardDescription>
                {t('landing.feature.multilingual.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle>{t('landing.feature.privacy.title')}</CardTitle>
              <CardDescription>
                {t('landing.feature.privacy.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-cyan-400" />
              </div>
              <CardTitle>{t('landing.feature.avatar.title')}</CardTitle>
              <CardDescription>
                {t('landing.feature.avatar.description')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 max-w-screen-xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{t('landing.howItWorks.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-semibold">{t('landing.step1.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.step1.description')}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-semibold">{t('landing.step2.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.step2.description')}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-semibold">{t('landing.step3.title')}</h3>
              <p className="text-muted-foreground">
                {t('landing.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 max-w-screen-xl">
        <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold">{t('landing.cta.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  {t('landing.cta.button')}
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                {t('landing.cta.noCreditCard')}
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                {t('landing.cta.quickSetup')}
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                {t('landing.cta.privacyFirst')}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
