import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  detectLanguage,
  directionFor,
  isSupportedLanguage,
  translate,
  translateList,
  type Language,
  SUPPORTED_LANGUAGES,
} from '../i18n/loader';

const STORAGE_KEY = 'profiley-language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tList: (key: string, params?: Record<string, string | number>) => string[];
  dir: 'ltr' | 'rtl';
  supportedLanguages: readonly Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function applyDocumentLanguage(lang: Language) {
  if (typeof document === 'undefined') return;
  document.documentElement.dir = directionFor(lang);
  document.documentElement.lang = lang;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initial state: synchronously detect on first render so the initial paint
  // matches the user's system language. Falls back to 'en' in non-DOM contexts.
  const [language, setLanguageState] = useState<Language>(() => detectLanguage(STORAGE_KEY));

  // Apply <html dir/lang> on every change (and on mount).
  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    if (!isSupportedLanguage(lang)) return;
    setLanguageState(lang);
    try {
      window.localStorage?.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage may be unavailable (private mode); ignore.
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(language, key, params),
    [language],
  );

  const tList = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translateList(language, key, params),
    [language],
  );

  const dir = directionFor(language);

  const value = useMemo<LanguageContextType>(
    () => ({ language, setLanguage, t, tList, dir, supportedLanguages: SUPPORTED_LANGUAGES }),
    [language, setLanguage, t, tList, dir],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export type { Language } from '../i18n/loader';
export { SUPPORTED_LANGUAGES } from '../i18n/loader';
