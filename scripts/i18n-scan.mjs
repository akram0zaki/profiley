#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { formatScanReport, scanLocaleCoverage } from '../apps/frontend/src/app/i18n/locale-scan.mjs';

const supportedFlags = new Set(['--list']);
const args = process.argv.slice(2);
const unknownArgs = args.filter((arg) => !supportedFlags.has(arg));

if (unknownArgs.length > 0) {
  console.error(`Unknown argument${unknownArgs.length === 1 ? '' : 's'}: ${unknownArgs.join(', ')}`);
  console.error('Usage: pnpm i18n:scan [--list]');
  process.exit(1);
}

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), '..');
const localesRoot = path.join(repoRoot, 'apps/frontend/src/app/i18n/locales');
const report = scanLocaleCoverage({ localesRoot });

console.log(formatScanReport(report, { list: args.includes('--list') }));
process.exit(report.totalMissingKeys === 0 ? 0 : 1);
