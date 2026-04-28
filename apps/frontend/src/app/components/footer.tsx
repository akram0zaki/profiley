import { Link } from 'react-router';
import { useLanguage } from '../contexts/language-context';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/40 py-12 bg-background mt-auto">
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="font-bold text-white">P</span>
              </div>
              <span className="font-semibold">{t('landing.brand')}</span>
            </div>
            <nav
              aria-label={t('legal.footer.title')}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
            >
              <Link
                to="/legal/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('legal.footer.terms')}
              </Link>
              <Link
                to="/legal/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('legal.footer.privacy')}
              </Link>
              <Link
                to="/legal/cookies"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('legal.footer.cookies')}
              </Link>
            </nav>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {t('landing.footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
