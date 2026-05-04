import { useLanguage } from '../contexts/language-context';

/**
 * Renders a visually hidden "Skip to main content" link that becomes visible on
 * focus. Must be the first focusable element in the DOM (WCAG 2.4.1).
 */
export function SkipLink() {
  const { t } = useLanguage();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {t('a11y.skipToContent')}
    </a>
  );
}
