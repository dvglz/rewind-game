import { expect, test } from 'vitest';
import { calculateScore, getResultColor, getResultEmoji } from './scoring';

test('maps year gaps into the five presentation tiers', () => {
  expect(getResultColor(0)).toBe('perfect');
  expect(getResultColor(2)).toBe('great');
  expect(getResultColor(4)).toBe('ballpark');
  expect(getResultColor(7)).toBe('wrong-era');
  expect(getResultColor(12)).toBe('not-even-close');
});

test('uses colored circle emojis for the five tiers', () => {
  expect(getResultEmoji(getResultColor(0))).toBe('🟢');
  expect(getResultEmoji(getResultColor(2))).toBe('🟢');
  expect(getResultEmoji(getResultColor(4))).toBe('🟡');
  expect(getResultEmoji(getResultColor(7))).toBe('🟠');
  expect(getResultEmoji(getResultColor(12))).toBe('🔴');
});

test('uses the hand-tuned score table for early misses', () => {
  expect(calculateScore(1)).toBe(82);
  expect(calculateScore(3)).toBe(64);
  expect(calculateScore(5)).toBe(50);
  expect(calculateScore(9)).toBe(20);
});
