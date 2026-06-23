import { describe, it, expect } from 'vitest';
import { computeNavSearch } from './navigation';

describe('computeNavSearch (URL params per screen)', () => {
  it('clears mode + returnTo when going home', () => {
    expect(computeNavSearch('mode=leaderboard&returnTo=home', 'home')).toBe('');
  });

  it('sets mode for non-home screens', () => {
    expect(computeNavSearch('', 'leaderboard')).toBe('mode=leaderboard');
  });

  it('preserves returnTo only for the auth screen', () => {
    expect(computeNavSearch('returnTo=results', 'auth')).toBe('returnTo=results&mode=auth');
    expect(computeNavSearch('returnTo=results', 'groups')).toBe('mode=groups');
  });

  it('keeps practice context on the game and results screens', () => {
    expect(computeNavSearch('mode=game&date=2026-06-22&practice=1', 'results')).toBe(
      'mode=results&date=2026-06-22&practice=1',
    );
  });

  it('drops practice context (date + practice) when leaving practice for home', () => {
    expect(computeNavSearch('mode=game&date=2026-06-22&practice=1', 'home')).toBe('');
  });

  it('drops practice context when leaving practice for any non-game/results screen', () => {
    expect(computeNavSearch('mode=results&date=2026-06-22&practice=1', 'leaderboard')).toBe('mode=leaderboard');
  });

  it('clears a stale archiveDate when navigating away', () => {
    expect(computeNavSearch('mode=auth&returnTo=archive&archiveDate=2026-06-22', 'home')).toBe('');
  });

  it('does NOT strip a date override when not in practice (e.g. lab mode)', () => {
    expect(computeNavSearch('date=2026-06-10', 'home')).toBe('date=2026-06-10');
  });
});
