import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('desktop game header keeps brand and dots on the left with score above muted timer on the right', () => {
  const css = readFileSync(resolve(__dirname, './Header.module.css'), 'utf8');
  const desktopBlock = css.match(/@media \(min-width:\s*900px\)\s*\{([\s\S]*)\n\}/);

  expect(desktopBlock?.[1] ?? '').not.toMatch(/\.gameHeader\s*\{[^}]*background:\s*#000;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/\.gameHeader\s*\{[^}]*min-height:\s*72px;[^}]*padding:\s*12px 24px 14px;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/\.gameHeader \.inner\s*\{[^}]*grid-template-rows:\s*auto auto;[^}]*align-items:\s*flex-start;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/\.gameHeader \.headerLeft\s*\{[^}]*grid-column:\s*1;[^}]*gap:\s*0;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/\.gameHeader \.progress\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*2;[^}]*margin-top:\s*8px;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/\.gameHeader \.date\s*\{[^}]*font-size:\s*20px;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/\.gameHeader \.headerRight\s*\{[^}]*grid-column:\s*3;[^}]*grid-row:\s*1 \/ span 2;[^}]*align-self:\s*flex-start;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/\.gameHeader \.totalTime\s*\{[^}]*color:\s*var\(--color-muted\);/);
  expect(desktopBlock?.[1] ?? '').not.toMatch(/\.gameHeader \.brand,\s*[\s\S]*?display:\s*none;/);
  expect(desktopBlock?.[1] ?? '').not.toMatch(/\.gameHeader \.date,\s*[\s\S]*?display:\s*none;/);
  expect(desktopBlock?.[1] ?? '').not.toMatch(/\.gameHeader \.headerRight\s*\{[^}]*display:\s*none;/);
});

test('score label inherits score value typography and color', () => {
  const css = readFileSync(resolve(__dirname, './Header.module.css'), 'utf8');
  const scoreLabelBlock = css.match(/\.scoreLabel\s*\{([^}]*)\}/)?.[1] ?? '';

  expect(scoreLabelBlock).not.toMatch(/font-size:/);
  expect(scoreLabelBlock).not.toMatch(/color:/);
  expect(scoreLabelBlock).not.toMatch(/font-family:/);
  expect(scoreLabelBlock).not.toMatch(/font-weight:/);
});

test('desktop round dots are compact', () => {
  const css = readFileSync(resolve(__dirname, './RoundDots.module.css'), 'utf8');
  const desktopBlock = css.match(/@media \(min-width:\s*900px\)\s*\{([\s\S]*)\n\}/);

  expect(desktopBlock?.[1] ?? '').toMatch(/\.dots\s*\{[^}]*gap:\s*5px;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/\.dot\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;/);
});
