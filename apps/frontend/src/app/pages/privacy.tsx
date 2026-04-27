import { useLanguage } from '../contexts/language-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { LegalLayout, LegalSection, LegalList } from './legal-layout';

const PROCESSOR_IDS = ['supabase', 'cloudflare', 'openai', 'gemini', 'mistral'] as const;

export default function PrivacyPage() {
  const { t, tList } = useLanguage();
  const ns = 'legal.privacy';

  return (
    <LegalLayout title={t(`${ns}.title`)} lead={t(`${ns}.lead`)}>
      <LegalSection title={t(`${ns}.controller.title`)}>
        <p>{t(`${ns}.controller.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.scope.title`)}>
        <p>{t(`${ns}.scope.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.categories.title`)}>
        <LegalList
          intro={t(`${ns}.categories.intro`)}
          items={tList(`${ns}.categories.items`)}
        />
      </LegalSection>

      <LegalSection title={t(`${ns}.purposes.title`)}>
        <LegalList intro={t(`${ns}.purposes.intro`)} items={tList(`${ns}.purposes.items`)} />
        <p className="text-sm italic">{t(`${ns}.purposes.noSpecial`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.automatedDecisions.title`)}>
        <p>{t(`${ns}.automatedDecisions.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.processors.title`)}>
        <p>{t(`${ns}.processors.intro`)}</p>
        <div className="overflow-x-auto rounded-lg border border-border/50 not-prose">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(`${ns}.processors.columns.name`)}</TableHead>
                <TableHead>{t(`${ns}.processors.columns.purpose`)}</TableHead>
                <TableHead>{t(`${ns}.processors.columns.data`)}</TableHead>
                <TableHead>{t(`${ns}.processors.columns.location`)}</TableHead>
                <TableHead>{t(`${ns}.processors.columns.transfer`)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROCESSOR_IDS.map((id) => (
                <TableRow key={id}>
                  <TableCell className="font-medium align-top">
                    {t(`${ns}.processors.items.${id}.name`)}
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {t(`${ns}.processors.items.${id}.purpose`)}
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {t(`${ns}.processors.items.${id}.data`)}
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {t(`${ns}.processors.items.${id}.location`)}
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {t(`${ns}.processors.items.${id}.transfer`)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p>{t(`${ns}.processors.outro`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.international.title`)}>
        <p>{t(`${ns}.international.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.retention.title`)}>
        <LegalList intro={t(`${ns}.retention.intro`)} items={tList(`${ns}.retention.items`)} />
      </LegalSection>

      <LegalSection title={t(`${ns}.rights.title`)}>
        <LegalList intro={t(`${ns}.rights.intro`)} items={tList(`${ns}.rights.items`)} />
        <p>{t(`${ns}.rights.howToExercise`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.security.title`)}>
        <p>{t(`${ns}.security.body`)}</p>
      </LegalSection>

      <LegalSection title={t(`${ns}.children.title`)}>
        <p>{t(`${ns}.children.body`)}</p>
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
