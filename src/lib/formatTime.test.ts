import { describe, expect, it } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('formats minute-plus durations', () => {
    expect(formatTime(159000)).toBe('02:39');
  });

  it('formats sub-minute durations', () => {
    expect(formatTime(47000)).toBe('00:47');
  });

  it('formats zero cleanly', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('preserves zero seconds in whole-minute values', () => {
    expect(formatTime(600000)).toBe('10:00');
  });
});
