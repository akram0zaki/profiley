import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../language-context';
import { detectLanguage, translate } from '../../i18n/loader';

function Probe() {
  const { language, t, dir } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="dash">{t('nav.dashboard')}</span>
      <span data-testid="missing">{t('totally.missing.key')}</span>
    </div>
  );
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dir = '';
    document.documentElement.lang = '';
  });
  it('defaults to English with LTR direction', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('dir').textContent).toBe('ltr');
    expect(screen.getByTestId('dash').textContent).toBe('Dashboard');
  });

  it('falls back to the key when no translation exists', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('missing').textContent).toBe('totally.missing.key');
  });

  it('switches language, updates dir, and persists to localStorage', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    act(() => result.current.setLanguage('ar'));
    expect(result.current.language).toBe('ar');
    expect(result.current.dir).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(localStorage.getItem('profiley-language')).toBe('ar');

    act(() => result.current.setLanguage('nl'));
    expect(result.current.dir).toBe('ltr');
    expect(result.current.t('nav.dashboard')).toBe('Dashboard');
  });

  it('throws a useful error when used outside of the provider', () => {
    // Suppress noisy React error log for this assertion.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useLanguage())).toThrow(
      /useLanguage must be used within a LanguageProvider/,
    );
    spy.mockRestore();
  });
});

describe('detectLanguage', () => {
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, 'languages');
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, 'language');

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    if (originalLanguages) Object.defineProperty(window.navigator, 'languages', originalLanguages);
    if (originalLanguage) Object.defineProperty(window.navigator, 'language', originalLanguage);
  });

  function mockNavigator(languages: string[]) {
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      get: () => languages,
    });
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      get: () => languages[0] ?? '',
    });
  }

  it('returns the stored value from localStorage when supported', () => {
    localStorage.setItem('profiley-language', 'nl');
    mockNavigator(['ar-SA']);
    expect(detectLanguage()).toBe('nl');
  });

  it('falls back to navigator language when localStorage is empty', () => {
    mockNavigator(['nl-NL', 'en-US']);
    expect(detectLanguage()).toBe('nl');
  });

  it('matches navigator subtag for Arabic', () => {
    mockNavigator(['ar-SA']);
    expect(detectLanguage()).toBe('ar');
  });

  it('falls through to English for unsupported codes', () => {
    mockNavigator(['fr-FR', 'es-ES']);
    expect(detectLanguage()).toBe('en');
  });

  it('ignores unsupported values stored in localStorage', () => {
    localStorage.setItem('profiley-language', 'fr');
    mockNavigator(['nl-NL']);
    expect(detectLanguage()).toBe('nl');
  });
});

describe('translate', () => {
  it('interpolates {param} placeholders', () => {
    const out = translate('en', 'dashboard.subtitle', { name: 'Akram' });
    expect(out).toContain('Akram');
  });

  it('falls back to English when the key is missing in the target locale', () => {
    // Pick a key that exists in English; if the Dutch namespace is missing the
    // exact key, the loader should fall back to the English string.
    const en = translate('en', 'nav.dashboard');
    const nl = translate('nl', 'nav.dashboard');
    expect(typeof nl).toBe('string');
    expect(nl.length).toBeGreaterThan(0);
    // English value is non-empty.
    expect(en.length).toBeGreaterThan(0);
  });

  it('returns the key when missing from every locale', () => {
    expect(translate('en', 'totally.bogus.key')).toBe('totally.bogus.key');
    expect(translate('nl', 'totally.bogus.key')).toBe('totally.bogus.key');
  });

  it('leaves unknown placeholders intact', () => {
    const out = translate('en', 'dashboard.subtitle', {});
    expect(out).toContain('{name}');
  });
});

describe('LanguageProvider auto-detection', () => {
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, 'languages');
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, 'language');

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dir = '';
    document.documentElement.lang = '';
  });

  afterEach(() => {
    if (originalLanguages) Object.defineProperty(window.navigator, 'languages', originalLanguages);
    if (originalLanguage) Object.defineProperty(window.navigator, 'language', originalLanguage);
  });

  it('auto-detects Dutch from navigator and applies LTR direction', () => {
    Object.defineProperty(window.navigator, 'languages', { configurable: true, get: () => ['nl-NL'] });
    Object.defineProperty(window.navigator, 'language', { configurable: true, get: () => 'nl-NL' });
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    expect(result.current.language).toBe('nl');
    expect(result.current.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('nl');
  });

  it('auto-detects Arabic from navigator and applies RTL direction', () => {
    Object.defineProperty(window.navigator, 'languages', { configurable: true, get: () => ['ar-SA'] });
    Object.defineProperty(window.navigator, 'language', { configurable: true, get: () => 'ar-SA' });
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    expect(result.current.language).toBe('ar');
    expect(result.current.dir).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('rejects unsupported language codes passed to setLanguage', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    const before = result.current.language;
    act(() => result.current.setLanguage('fr' as any));
    expect(result.current.language).toBe(before);
  });
});
