import { expect, test } from 'vitest';
import { calculateScore, getResultColor, getResultEmoji, getResultLabel } from './scoring';

test('maps year gaps into the four presentation tiers (green = exact only)', () => {
  expect(getResultColor(0)).toBe('perfect');
  expect(getResultColor(1)).toBe('ballpark');
  expect(getResultColor(3)).toBe('ballpark');
  expect(getResultColor(4)).toBe('wrong-era');
  expect(getResultColor(6)).toBe('wrong-era');
  expect(getResultColor(7)).toBe('not-even-close');
  expect(getResultColor(12)).toBe('not-even-close');
});

test('uses colored circle emojis for the four tiers', () => {
  expect(getResultEmoji(getResultColor(0))).toBe('🟢');
  expect(getResultEmoji(getResultColor(1))).toBe('🟡');
  expect(getResultEmoji(getResultColor(3))).toBe('🟡');
  expect(getResultEmoji(getResultColor(4))).toBe('🟠');
  expect(getResultEmoji(getResultColor(6))).toBe('🟠');
  expect(getResultEmoji(getResultColor(7))).toBe('🔴');
  expect(getResultEmoji(getResultColor(12))).toBe('🔴');
});

test('labels the worst tier as "Way Off"', () => {
  expect(getResultLabel(getResultColor(0))).toBe('Perfect');
  expect(getResultLabel(getResultColor(9))).toBe('Way Off');
});

test('uses the hand-tuned score table for early misses', () => {
  expect(calculateScore(1)).toBe(82);
  expect(calculateScore(3)).toBe(64);
  expect(calculateScore(5)).toBe(50);
  expect(calculateScore(9)).toBe(20);
});
