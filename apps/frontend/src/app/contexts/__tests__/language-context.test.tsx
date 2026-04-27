import { describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../language-context';

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
