import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('timeline uses a more compact mobile geometry', () => {
  const css = readFileSync(resolve(__dirname, './Timeline.module.css'), 'utf8');
  const wrapperBlock = css.match(/\.wrapper\s*\{([^}]*)\}/);
  const trackBlock = css.match(/\.track\s*\{([^}]*)\}/);

  expect(wrapperBlock?.[1] ?? '').toMatch(/height:\s*var\(--timeline-height,\s*320px\);/);
  expect(trackBlock?.[1] ?? '').toMatch(/padding-top:\s*20px;/);
});
