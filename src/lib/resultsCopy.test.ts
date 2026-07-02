import { describe, it, expect } from 'vitest';
import { getClaimAsk } from './resultsCopy';

const MAX = 10000;

describe('getClaimAsk', () => {
  it('returns null for authenticated users (no ask)', () => {
    expect(getClaimAsk({ isAuthenticated: true, totalScore: 9000, maxScore: MAX, msToReset: 3_600_000 })).toBeNull();
  });

  it('uses the plain claim copy for a normal logged-out score', () => {
    const ask = getClaimAsk({ isAuthenticated: false, totalScore: 5000, maxScore: MAX, msToReset: 10 * 3_600_000 });
    expect(ask).not.toBeNull();
    expect(ask!.headline).toBe('Claim your rank');
    expect(ask!.urgency).toBeNull();
  });

  it('amplifies the headline for a high score (>=80% of max)', () => {
    const ask = getClaimAsk({ isAuthenticated: false, totalScore: 8000, maxScore: MAX, msToReset: 10 * 3_600_000 });
    expect(ask!.headline).toBe('Top score — claim your rank');
  });

  it('adds reset urgency when under 2h remain', () => {
    const ask = getClaimAsk({ isAuthenticated: false, totalScore: 5000, maxScore: MAX, msToReset: 90 * 60_000 });
    expect(ask!.urgency).toBe('Today’s board locks soon');
  });
});
