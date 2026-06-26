import { describe, it, expect } from 'vitest';
import { msToNextReset, formatCountdown } from './countdown';

describe('msToNextReset', () => {
  it('returns ms until the next Pacific midnight', () => {
    // 2026-06-24T07:00:00Z === 2026-06-24 00:00 PDT (UTC-7) — exactly midnight Pacific.
    const atMidnightPacific = new Date('2026-06-24T07:00:00Z');
    // Next reset is 24h later.
    expect(msToNextReset(atMidnightPacific)).toBe(24 * 60 * 60 * 1000);
  });

  it('counts down through the day', () => {
    // One hour after Pacific midnight → 23h left.
    const oneHourIn = new Date('2026-06-24T08:00:00Z');
    expect(msToNextReset(oneHourIn)).toBe(23 * 60 * 60 * 1000);
  });

  it('is always positive and at most 24h', () => {
    const ms = msToNextReset(new Date('2026-06-24T19:33:21Z'));
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });
});

describe('formatCountdown', () => {
  it('formats ms as HH:MM:SS zero-padded', () => {
    expect(formatCountdown(23 * 3600_000 + 59 * 60_000 + 1_000)).toBe('23:59:01');
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(5_000)).toBe('00:00:05');
  });

  it('clamps negatives to zero', () => {
    expect(formatCountdown(-5_000)).toBe('00:00:00');
  });
});
