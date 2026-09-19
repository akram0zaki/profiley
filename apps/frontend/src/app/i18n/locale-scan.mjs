import fs from 'node:fs';
import path from 'node:path';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function collectMissingKeys(expected, actual, currentPath = '') {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      return expected.map((_, index) => `${currentPath}[${index}]`);
    }

    const missingKeys = [];
    for (let index = 0; index < expected.length; index += 1) {
      const nextPath = `${currentPath}[${index}]`;
      if (actual[index] === undefined) {
        missingKeys.push(nextPath);
        continue;
      }
      missingKeys.push(...collectMissingKeys(expected[index], actual[index], nextPath));
    }
    return missingKeys;
  }

  if (isPlainObject(expected)) {
    const actualObject = isPlainObject(actual) ? actual : undefined;
    const missingKeys = [];

    for (const [key, value] of Object.entries(expected)) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      missingKeys.push(...collectMissingKeys(value, actualObject?.[key], nextPath));
    }

    return missingKeys;
  }

  return actual === undefined ? [currentPath] : [];
}

function listJsonNamespaces(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name.replace(/\.json$/, ''))
    .sort();
}

export function scanLocaleCoverage({ localesRoot, canonicalLanguage = 'en' }) {
  const canonicalDir = path.join(localesRoot, canonicalLanguage);
  const canonicalNamespaces = listJsonNamespaces(canonicalDir);
  const languages = fs
    .readdirSync(localesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== canonicalLanguage)
    .map((entry) => entry.name)
    .sort();

  const languageReports = languages.map((language) => {
    const languageDir = path.join(localesRoot, language);
    const missingNamespaceFiles = [];
    const missingKeys = [];

    for (const namespace of canonicalNamespaces) {
      const expected = readJsonFile(path.join(canonicalDir, `${namespace}.json`));
      const languageFilePath = path.join(languageDir, `${namespace}.json`);

      if (!fs.existsSync(languageFilePath)) {
        const namespaceMissingKeys = collectMissingKeys(expected, undefined, namespace);
        missingNamespaceFiles.push({
          namespace,
          missingKeyCount: namespaceMissingKeys.length,
        });
        missingKeys.push(...namespaceMissingKeys);
        continue;
      }

      const actual = readJsonFile(languageFilePath);
      missingKeys.push(...collectMissingKeys(expected, actual, namespace));
    }

    return {
      language,
      checkedNamespaceCount: canonicalNamespaces.length,
      missingNamespaceFiles,
      missingKeys,
    };
  });

  return {
    canonicalLanguage,
    namespaceCount: canonicalNamespaces.length,
    languages: languageReports,
    totalMissingKeys: languageReports.reduce((total, report) => total + report.missingKeys.length, 0),
  };
}

function pluralize(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export function formatScanReport(report, { list = false } = {}) {
  if (report.totalMissingKeys === 0) {
    return `No missing i18n keys relative to ${report.canonicalLanguage} across ${pluralize(report.namespaceCount, 'namespace')} and ${pluralize(report.languages.length, 'target locale')}.`;
  }

  const lines = [`Missing i18n keys relative to ${report.canonicalLanguage}:`];

  for (const languageReport of report.languages) {
    if (languageReport.missingKeys.length === 0) {
      continue;
    }

    const namespaceSummary = languageReport.missingNamespaceFiles.length
      ? `, ${pluralize(languageReport.missingNamespaceFiles.length, 'missing namespace file')}`
      : '';

    lines.push(
      `- ${languageReport.language}: ${pluralize(languageReport.missingKeys.length, 'missing key')}${namespaceSummary}`,
    );

    if (!list) {
      continue;
    }

    for (const missingNamespace of languageReport.missingNamespaceFiles) {
      lines.push(
        `  namespace file missing: ${missingNamespace.namespace}.json (${pluralize(missingNamespace.missingKeyCount, 'key')})`,
      );
    }

    for (const missingKey of languageReport.missingKeys) {
      lines.push(`  - ${missingKey}`);
    }
  }

  if (!list) {
    lines.push('Run `pnpm i18n:scan --list` to list the exact keys.');
  }

  return lines.join('\n');
}
