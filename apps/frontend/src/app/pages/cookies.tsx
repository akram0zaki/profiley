import { useLanguage } from '../contexts/language-context';
import { useDocumentTitle } from '../hooks/use-document-title';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { LegalLayout, LegalSection, LegalList } from './legal-layout';

const COOKIE_IDS = ['auth', 'language', 'theme', 'cf'] as const;

export default function CookiesPage() {
  const { t, tList } = useLanguage();
  useDocumentTitle(t('legal.cookies.title'));
  const ns = 'legal.cookies';

  return (
    <LegalLayout title={t(`${ns}.title`)} lead={t(`${ns}.lead`)}>
      <LegalSection title={t(`${ns}.what.title`)}>
        <p>{t(`${ns}.what.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.categories.title`)}>
        <p>{t(`${ns}.categories.intro`)}</p>
        <div className="overflow-x-auto rounded-lg border border-border/50 not-prose">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(`${ns}.categories.columns.name`)}</TableHead>
                <TableHead>{t(`${ns}.categories.columns.purpose`)}</TableHead>
                <TableHead>{t(`${ns}.categories.columns.type`)}</TableHead>
                <TableHead>{t(`${ns}.categories.columns.duration`)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COOKIE_IDS.map((id) => (
                <TableRow key={id}>
                  <TableCell className="font-mono text-xs align-top">
                    {t(`${ns}.categories.items.${id}.name`)}
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {t(`${ns}.categories.items.${id}.purpose`)}
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {t(`${ns}.categories.items.${id}.type`)}
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {t(`${ns}.categories.items.${id}.duration`)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </LegalSection>

      <LegalSection title={t(`${ns}.consent.title`)}>
        <p>{t(`${ns}.consent.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.control.title`)}>
        <LegalList
          intro={t(`${ns}.control.intro`)}
          items={tList(`${ns}.control.items`)}
          outro={t(`${ns}.control.outro`)}
        />
      </LegalSection>

      <LegalSection title={t(`${ns}.changes.title`)}>
        <p>{t(`${ns}.changes.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.contact.title`)}>
        <p>{t(`${ns}.contact.body`)}</p>
      </LegalSection>
    </LegalLayout>
  );
}
