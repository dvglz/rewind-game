import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

test('game screen reserves fixed top space so timeline does not shift on reveal', () => {
  const css = readFileSync(resolve(__dirname, './GameScreen.module.css'), 'utf8');
  const topSectionBlock = css.match(/\.topSection\s*\{([^}]*)\}/);
  const timelineRegionBlock = css.match(/\.timelineRegion\s*\{([^}]*)\}/);

  expect(topSectionBlock?.[1] ?? '').toMatch(/min-height:\s*\d+px;/);
  expect(timelineRegionBlock?.[1] ?? '').toMatch(/align-items:\s*flex-start;/);
});
