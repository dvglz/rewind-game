import { describe, it, expect } from 'vitest';
import { calculateScore, getResultColor } from '../src/engine/scoring';

describe('calculateScore', () => {
  it('returns 1000 for exact guess', () => {
    expect(calculateScore(0)).toBe(1000);
  });

  it('returns high score for 1 year off', () => {
    const score = calculateScore(1);
    expect(score).toBeGreaterThan(700);
    expect(score).toBeLessThan(1000);
  });

  it('returns moderate score for 3 years off', () => {
    const score = calculateScore(3);
    expect(score).toBeGreaterThan(300);
    expect(score).toBeLessThan(600);
  });

  it('returns low score for 10+ years off', () => {
    const score = calculateScore(10);
    expect(score).toBeLessThan(150);
  });

  it('treats positive and negative diff the same', () => {
    expect(calculateScore(-3)).toBe(calculateScore(3));
  });

  it('never returns below 0', () => {
    expect(calculateScore(30)).toBeGreaterThanOrEqual(0);
  });
});

describe('getResultColor', () => {
  it('returns correct for 0 or 1 off', () => {
    expect(getResultColor(0)).toBe('correct');
    expect(getResultColor(1)).toBe('correct');
    expect(getResultColor(-1)).toBe('correct');
  });

  it('returns close for 2-3 off', () => {
    expect(getResultColor(2)).toBe('close');
    expect(getResultColor(3)).toBe('close');
  });

  it('returns wrong for 4+ off', () => {
    expect(getResultColor(4)).toBe('wrong');
    expect(getResultColor(-10)).toBe('wrong');
  });
});
