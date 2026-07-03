import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('timeline uses a more compact mobile geometry', () => {
  const css = readFileSync(resolve(__dirname, './Timeline.module.css'), 'utf8');
  const wrapperBlock = css.match(/\.wrapper\s*\{([^}]*)\}/);
  const trackBlock = css.match(/\.track\s*\{([^}]*)\}/);

  expect(wrapperBlock?.[1] ?? '').toMatch(/height:\s*min\(var\(--timeline-height,\s*320px\),\s*100%\);/);
  expect(trackBlock?.[1] ?? '').toMatch(/padding-top:\s*20px;/);
});

test('desktop timeline keeps long tick marks', () => {
  const css = readFileSync(resolve(__dirname, './Timeline.module.css'), 'utf8');
  const desktopBlock = css.match(/@media \(min-width:\s*900px\)\s*\{([\s\S]*)\n\}/);

  expect(desktopBlock?.[1] ?? '').toMatch(/\.tickMinor \.tickLine\s*\{[^}]*height:\s*132px;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/\.tickMajor \.tickLine\s*\{[^}]*height:\s*168px;/);
});
