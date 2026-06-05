import { describe, expect, it } from 'vitest';
import { easeOvershoot, getScrollDuration } from './useTimeline';

describe('easeOvershoot', () => {
  it('returns 0 at t=0', () => {
    expect(easeOvershoot(0)).toBeCloseTo(0, 5);
  });

  it('returns 1 at t=1', () => {
    expect(easeOvershoot(1)).toBeCloseTo(1, 5);
  });

  it('starts slightly slower so direction reads clearly', () => {
    expect(easeOvershoot(0.1)).toBeLessThan(0.02);
  });

  it('overshoots past 1.0 near the end', () => {
    expect(easeOvershoot(0.94)).toBeCloseTo(1.008, 2);
  });

  it('peak is approximately 1.008', () => {
    const peak = easeOvershoot(0.94);
    expect(peak).toBeGreaterThan(1.006);
    expect(peak).toBeLessThan(1.01);
  });

  it('is monotonically increasing in the first phase', () => {
    let prev = 0;
    for (let t = 0.05; t <= 0.9; t += 0.05) {
      const val = easeOvershoot(t);
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }
  });

  it('settles back from overshoot in the second phase', () => {
    const atPeak = easeOvershoot(0.94);
    const atEnd = easeOvershoot(1);
    expect(atPeak).toBeGreaterThan(atEnd);
  });
});

describe('getScrollDuration', () => {
  it('returns 900 for 1-year diff', () => {
    expect(getScrollDuration(1)).toBe(900);
  });

  it('returns yearDiff * 160 for mid-range', () => {
    expect(getScrollDuration(10)).toBe(1600);
  });

  it('clamps to 2400 for large diffs', () => {
    expect(getScrollDuration(20)).toBe(2400);
  });

  it('returns 900 minimum for 0 diff', () => {
    expect(getScrollDuration(0)).toBe(900);
  });
});
