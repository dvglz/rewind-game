import { expect, test } from 'vitest';
import { getPuzzleForDate } from './puzzles';

test('starts the launch puzzle sequence at #001 on June 16, 2026', () => {
  expect(getPuzzleForDate('2026-06-16').number).toBe(1);
});
