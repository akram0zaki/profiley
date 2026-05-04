import { useEffect } from 'react';

/**
 * Updates `document.title` on mount and restores the previous title on unmount.
 * Use in every page component so screen-reader users know which page they're on.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — Profiley` : 'Profiley';
    return () => {
      document.title = prev;
    };
  }, [title]);
}
