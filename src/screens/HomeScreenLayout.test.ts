import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('compact desktop home screen keeps the title block close to the action', () => {
  const css = readFileSync(resolve(__dirname, './HomeScreen.module.css'), 'utf8');
  const desktopBlock = css.match(/@media \(min-width:\s*900px\)\s*\{([\s\S]*)\n\}/);

  expect(desktopBlock?.[1] ?? '').toMatch(/\.containerCompact\s*\{[^}]*gap:\s*clamp\(24px,\s*5vh,\s*56px\);/);
});
