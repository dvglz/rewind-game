import { describe, it, expect } from 'vitest';
import { calculateScore, getMaxPossibleScore, getResultColor, ROUND_WEIGHTS } from '../src/engine/scoring';

describe('calculateScore', () => {
  it('returns 100 for an exact first-round guess', () => {
    expect(calculateScore(0)).toBe(100);
  });

  it('uses escalating round weights that sum to 1000 total', () => {
    expect([...ROUND_WEIGHTS]).toEqual([100, 100, 200, 300, 300]);
    expect(getMaxPossibleScore(5)).toBe(1000);
  });

  it('drops sharply after a 1-year miss', () => {
    const score = calculateScore(1);
    expect(score).toBe(82);
  });

  it('returns a moderate first-round score for 3 years off', () => {
    const score = calculateScore(3);
    expect(score).toBe(64);
  });

  it('returns low score for 10+ years off', () => {
    const score = calculateScore(10);
    expect(score).toBe(20);
  });

  it('treats positive and negative diff the same', () => {
    expect(calculateScore(-3)).toBe(calculateScore(3));
  });

  it('never returns below 0', () => {
    expect(calculateScore(30)).toBeGreaterThanOrEqual(0);
  });
});

describe('getResultColor', () => {
  it('returns perfect for exact hits only', () => {
    expect(getResultColor(0)).toBe('perfect');
  });

  it('returns ballpark for 1-3 years off', () => {
    expect(getResultColor(1)).toBe('ballpark');
    expect(getResultColor(3)).toBe('ballpark');
  });

  it('returns wrong era for 4-6 years off', () => {
    expect(getResultColor(4)).toBe('wrong-era');
    expect(getResultColor(-6)).toBe('wrong-era');
  });

  it('returns way off for 7+ years off', () => {
    expect(getResultColor(7)).toBe('not-even-close');
    expect(getResultColor(-10)).toBe('not-even-close');
  });
});
