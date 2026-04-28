import { ReactNode } from 'react';
import { Link } from 'react-router';
import { Languages, Sun, Moon, Check, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  SimpleDropdown,
  SimpleDropdownItem,
  SimpleDropdownLabel,
  SimpleDropdownSeparator,
} from '../components/simple-dropdown';
import { useLanguage } from '../contexts/language-context';
import { useTheme } from '../components/theme-provider';

const LANGUAGES = [
  { code: 'en' as const, nativeName: 'English' },
  { code: 'nl' as const, nativeName: 'Nederlands' },
  { code: 'ar' as const, nativeName: 'العربية' },
];

interface LegalLayoutProps {
  title: string;
  lead: string;
  children: ReactNode;
}

export function LegalLayout({ title, lead, children }: LegalLayoutProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-screen-xl">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">P</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {t('landing.brand')}
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <SimpleDropdown
              trigger={
                <Button variant="ghost" size="sm" className="gap-2">
                  <Languages className="h-4 w-4" />
                  <span className="text-sm hidden sm:inline">
                    {LANGUAGES.find((l) => l.code === language)?.code.toUpperCase()}
                  </span>
                </Button>
              }
              className="w-48"
            >
              <SimpleDropdownLabel>{t('nav.language')}</SimpleDropdownLabel>
              <SimpleDropdownSeparator />
              {LANGUAGES.map((lang) => (
                <SimpleDropdownItem key={lang.code} onClick={() => setLanguage(lang.code)}>
                  <div className="flex flex-col flex-1">
                    <span>{lang.nativeName}</span>
                  </div>
                  {language === lang.code && (
                    <Check className="h-4 w-4 text-primary mx-2" />
                  )}
                </SimpleDropdownItem>
              ))}
            </SimpleDropdown>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 md:py-20 max-w-3xl">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t('legal.backToHome')}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-2">{t('legal.lastUpdated')}</p>
        <p className="text-base text-muted-foreground mb-8 leading-relaxed">{lead}</p>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="prose prose-invert max-w-none pt-6 space-y-8">
            {children}
          </CardContent>
        </Card>

        {/* Cross-links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/legal/terms" className="hover:text-foreground transition-colors">
            {t('legal.footer.terms')}
          </Link>
          <Link to="/legal/privacy" className="hover:text-foreground transition-colors">
            {t('legal.footer.privacy')}
          </Link>
          <Link to="/legal/cookies" className="hover:text-foreground transition-colors">
            {t('legal.footer.cookies')}
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container mx-auto px-4 max-w-screen-xl text-center">
          <p className="text-sm text-muted-foreground">{t('landing.footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}

interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium text-foreground">{title}</h2>
      <div className="text-base text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

interface LegalListProps {
  intro?: string;
  items: string[];
  outro?: string;
}

export function LegalList({ intro, items, outro }: LegalListProps) {
  return (
    <>
      {intro ? <p>{intro}</p> : null}
      <ul className="list-disc ps-6 space-y-2">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      {outro ? <p>{outro}</p> : null}
    </>
  );
}
