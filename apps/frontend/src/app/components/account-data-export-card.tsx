import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { api, ApiError, type UserDataExportBundle } from '../../lib/api';
import { useLanguage } from '../contexts/language-context';

function createExportFilename(exportedAt: string): string {
  return `profiley-export-${exportedAt.replace(/[:.]/g, '-').replace(/Z$/, 'Z')}.json`;
}

export function downloadExportBundle(bundle: UserDataExportBundle): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createExportFilename(bundle.manifest.exportedAt);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AccountDataExportCard() {
  const { t } = useLanguage();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const bundle = await api.exportUserData();
      downloadExportBundle(bundle);
      toast.success(t('settings.dataExport.feedback.ready'));
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : t('settings.dataExport.feedback.failed');
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.dataExport.title')}</CardTitle>
        <CardDescription>{t('settings.dataExport.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
          <p>{t('settings.dataExport.body')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleExport()} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('settings.dataExport.exporting')}
              </>
            ) : (
              t('settings.dataExport.button')
            )}
          </Button>
          <p className="text-xs text-muted-foreground">{t('settings.dataExport.hint')}</p>
        </div>
      </CardContent>
    </Card>
  );
}