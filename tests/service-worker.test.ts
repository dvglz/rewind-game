import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('service worker does not precache the HTML shell and uses network-first for documents', () => {
  const sw = readFileSync(resolve(__dirname, '../public/sw.js'), 'utf8');

  expect(sw).not.toMatch(/['"]\/['"]/);
  expect(sw).not.toMatch(/['"]\/index\.html['"]/);
  expect(sw).toMatch(/event\.request\.mode === ['"]navigate['"]/);
  expect(sw).toMatch(/fetch\(event\.request\)\.catch\(\(\) => caches\.match\(event\.request\)\)/);
});
