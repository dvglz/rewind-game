import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('service worker does not precache the HTML shell and fetches documents from the network', () => {
  const sw = readFileSync(resolve(__dirname, '../public/sw.js'), 'utf8');

  expect(sw).not.toMatch(/['"]\/['"]/);
  expect(sw).not.toMatch(/['"]\/index\.html['"]/);
  expect(sw).toMatch(/request\.mode === ['"]navigate['"]/);
  expect(sw).toMatch(/event\.respondWith\(fetch\(event\.request\)\)/);
});

test('service worker bypasses auth document requests and non-GET requests', () => {
  const sw = readFileSync(resolve(__dirname, '../public/sw.js'), 'utf8');

  expect(sw).toMatch(/event\.request\.method !== ['"]GET['"]/);
  expect(sw).toMatch(/accept\.includes\(['"]text\/html['"]\)/);
  expect(sw).toMatch(/request\.destination === ['"]iframe['"]/);
  expect(sw).toMatch(/if \(!isCacheableAssetRequest\(event\.request\)\) return;/);
});
