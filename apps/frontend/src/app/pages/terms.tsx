import { useLanguage } from '../contexts/language-context';
import { useDocumentTitle } from '../hooks/use-document-title';
import { LegalLayout, LegalSection, LegalList } from './legal-layout';

export default function TermsPage() {
  const { t, tList } = useLanguage();
  const ns = 'legal.terms';
  useDocumentTitle(t(`${ns}.title`));

  return (
    <LegalLayout title={t(`${ns}.title`)} lead={t(`${ns}.lead`)}>
      <LegalSection title={t(`${ns}.operator.title`)}>
        <p>{t(`${ns}.operator.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.service.title`)}>
        <p>{t(`${ns}.service.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.accounts.title`)}>
        <p>{t(`${ns}.accounts.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.userContent.title`)}>
        <p>{t(`${ns}.userContent.body`)}</p>
        <p>{t(`${ns}.userContent.warranty`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.acceptableUse.title`)}>
        <LegalList
          intro={t(`${ns}.acceptableUse.intro`)}
          items={tList(`${ns}.acceptableUse.items`)}
        />
      </LegalSection>

      <LegalSection title={t(`${ns}.ai.title`)}>
        <p>{t(`${ns}.ai.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.thirdParties.title`)}>
        <p>{t(`${ns}.thirdParties.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.termination.title`)}>
        <p>{t(`${ns}.termination.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.liability.title`)}>
        <p>{t(`${ns}.liability.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.changes.title`)}>
        <p>{t(`${ns}.changes.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.law.title`)}>
        <p>{t(`${ns}.law.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.contact.title`)}>
        <p>{t(`${ns}.contact.body`)}</p>
      </LegalSection>
    </LegalLayout>
  );
}
