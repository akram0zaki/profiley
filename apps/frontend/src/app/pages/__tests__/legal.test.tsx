import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from '../../contexts/language-context';
import { ThemeProvider } from '../../components/theme-provider';
import { SUPPORTED_LANGUAGES } from '../../i18n/loader';
import enLegal from '../../i18n/locales/en/legal.json';
import nlLegal from '../../i18n/locales/nl/legal.json';
import arLegal from '../../i18n/locales/ar/legal.json';
import TermsPage from '../terms';
import PrivacyPage from '../privacy';
import CookiesPage from '../cookies';
import LandingPage from '../landing';
import { Footer } from '../../components/footer';

function renderWithProviders(ui: React.ReactElement, route = '/') {
  return render(
    <ThemeProvider defaultTheme="dark" storageKey="profiley-theme-test">
      <LanguageProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );
}

describe('Legal pages', () => {
  it('renders the Terms & Conditions title and key sections', () => {
    renderWithProviders(<TermsPage />);
    expect(screen.getByRole('heading', { level: 1, name: enLegal.terms.title })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: enLegal.terms.operator.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: enLegal.terms.law.title }),
    ).toBeInTheDocument();
  });

  it('renders the Privacy Policy with every third-party processor', () => {
    renderWithProviders(<PrivacyPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: enLegal.privacy.title }),
    ).toBeInTheDocument();

    // GDPR essentials surfaced in the document.
    expect(screen.getAllByText(/GDPR/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Autoriteit Persoonsgegevens/).length).toBeGreaterThan(0);

    // Each processor named in the locale must appear in the rendered table.
    for (const processor of Object.values(enLegal.privacy.processors.items)) {
      const nameCell = screen.getByText(processor.name);
      expect(nameCell).toBeInTheDocument();
      const row = nameCell.closest('tr');
      expect(row).not.toBeNull();
      expect(
        within(row as HTMLTableRowElement).getByRole('link', {
          name: processor.policyLabel,
        }),
      ).toHaveAttribute('href', processor.policyUrl);
    }
  });

  it('renders the Cookie Policy with the cookie inventory table', () => {
    renderWithProviders(<CookiesPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: enLegal.cookies.title }),
    ).toBeInTheDocument();
    expect(screen.getByText('sb-access-token / sb-refresh-token')).toBeInTheDocument();
    expect(screen.getByText('profiley-language')).toBeInTheDocument();
  });
});

describe('Landing footer legal links', () => {
  it('exposes the three mandatory legal documents', () => {
    renderWithProviders(
      <>
        <LandingPage />
        <Footer />
      </>,
    );
    const footers = screen.getAllByRole('contentinfo');
    const footer = footers[footers.length - 1];
    const nav = within(footer).getByRole('navigation', { name: enLegal.footer.title });
    expect(within(nav).getByRole('link', { name: enLegal.footer.terms })).toHaveAttribute(
      'href',
      '/legal/terms',
    );
    expect(within(nav).getByRole('link', { name: enLegal.footer.privacy })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
    expect(within(nav).getByRole('link', { name: enLegal.footer.cookies })).toHaveAttribute(
      'href',
      '/legal/cookies',
    );
  });
});

describe('Legal locales coverage', () => {
  // Ensures every supported language ships a legal namespace with the same
  // top-level structure required by the legal pages.
  const dictionaries: Record<string, unknown> = {
    en: enLegal,
    nl: nlLegal,
    ar: arLegal,
  };

  it.each(SUPPORTED_LANGUAGES.map((l) => [l] as const))(
    'locale "%s" defines all required legal sections',
    (lang) => {
      const dict = dictionaries[lang] as Record<string, Record<string, unknown>>;
      expect(typeof dict.footer).toBe('object');
      expect(dict.footer).toMatchObject({
        terms: expect.any(String),
        privacy: expect.any(String),
        cookies: expect.any(String),
      });
      expect(typeof (dict.terms as { title?: unknown }).title).toBe('string');
      expect(typeof (dict.privacy as { title?: unknown }).title).toBe('string');
      expect(typeof (dict.cookies as { title?: unknown }).title).toBe('string');
      // Every locale must enumerate the same processor IDs as English so the
      // privacy table stays in sync across translations.
      const enProcessors = Object.keys(enLegal.privacy.processors.items).sort();
      const langProcessors = Object.keys(
        (dict.privacy as { processors: { items: Record<string, unknown> } }).processors.items,
      ).sort();
      expect(langProcessors).toEqual(enProcessors);
    },
  );
});
