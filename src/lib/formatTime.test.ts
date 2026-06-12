import { describe, expect, it } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('formats minute-plus durations', () => {
    expect(formatTime(159000)).toBe('2m 39s');
  });

  it('formats sub-minute durations', () => {
    expect(formatTime(47000)).toBe('47s');
  });

  it('formats zero cleanly', () => {
    expect(formatTime(0)).toBe('0s');
  });

  it('preserves zero seconds in whole-minute values', () => {
    expect(formatTime(600000)).toBe('10m 0s');
  });
});
