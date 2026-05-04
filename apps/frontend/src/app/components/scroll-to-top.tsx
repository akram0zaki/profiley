import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Scrolls to top and moves focus to the main content area on every route
 * change so that keyboard and screen-reader users know navigation completed
 * (WCAG 2.4.3).
 */
export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    // Move focus to the <main> element so assistive technology announces
    // the new page content. The tabIndex={-1} attribute is set on <main>
    // in App.tsx to allow programmatic focus without making it part of the
    // natural tab order.
    const main = document.querySelector('main');
    if (main) {
      main.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  return null;
}