import { expect, test } from 'vitest';
import { RULES_LINES, RULES_HOOK } from './rulesCopy';

test('exposes the two rule lines in order', () => {
  expect(RULES_LINES).toEqual([
    '5 iconic sports moments. Scroll the timeline, lock the year. Closer guess, higher score.',
    'NBA, NFL, MLB, college, and more. Later rounds are worth more. Fastest time breaks ties.',
  ]);
});

test('exposes the hook line', () => {
  expect(RULES_HOOK).toBe('Can you hit perfect 1,000?');
});
