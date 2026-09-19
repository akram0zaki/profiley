import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  collectMissingKeys,
  formatScanReport,
  scanLocaleCoverage,
} from '../locale-scan.mjs';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dirPath = tempDirs.pop();
    if (dirPath) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }
});

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

describe('locale scan', () => {
  it('collects nested missing keys and array entries', () => {
    const expected = {
      title: 'Welcome',
      cta: {
        label: 'Continue',
        bullets: ['One', 'Two'],
      },
    };
    const actual = {
      cta: {
        bullets: ['One'],
      },
    };

    expect(collectMissingKeys(expected, actual, 'common')).toEqual([
      'common.title',
      'common.cta.label',
      'common.cta.bullets[1]',
    ]);
  });

  it('scans locale directories against english namespaces', () => {
    const localesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'profiley-i18n-'));
    tempDirs.push(localesRoot);

    writeJson(path.join(localesRoot, 'en', 'common.json'), {
      title: 'Welcome',
      cta: {
        label: 'Continue',
      },
    });
    writeJson(path.join(localesRoot, 'en', 'dashboard.json'), {
      title: 'Dashboard',
    });
    writeJson(path.join(localesRoot, 'nl', 'common.json'), {
      title: 'Welkom',
    });
    writeJson(path.join(localesRoot, 'ar', 'common.json'), {
      title: 'مرحبا',
      cta: {
        label: 'متابعة',
      },
    });
    writeJson(path.join(localesRoot, 'ar', 'dashboard.json'), {
      title: 'لوحة التحكم',
    });

    const report = scanLocaleCoverage({ localesRoot });
    const nlReport = report.languages.find((entry) => entry.language === 'nl');
    const arReport = report.languages.find((entry) => entry.language === 'ar');

    expect(report.namespaceCount).toBe(2);
    expect(nlReport).toEqual({
      language: 'nl',
      checkedNamespaceCount: 2,
      missingNamespaceFiles: [{ namespace: 'dashboard', missingKeyCount: 1 }],
      missingKeys: ['common.cta.label', 'dashboard.title'],
    });
    expect(arReport).toEqual({
      language: 'ar',
      checkedNamespaceCount: 2,
      missingNamespaceFiles: [],
      missingKeys: [],
    });
    expect(formatScanReport(report, { list: true })).toContain('common.cta.label');
    expect(formatScanReport(report, { list: true })).toContain('namespace file missing: dashboard.json');
  });
});
