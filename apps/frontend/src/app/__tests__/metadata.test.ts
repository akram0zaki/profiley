import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('frontend metadata', () => {
  it('uses the updated marketing title in index.html', () => {
    const filePath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../index.html');
    const html = readFileSync(filePath, 'utf8');

    expect(html).toContain('<title>Profiley — Let Your Experience Speak</title>');
  });
});