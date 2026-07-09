import { describe, it, expect } from 'vitest';
import { computeNavSearch, buildTo, screenFromPathname, pathForScreen, legacyRedirect } from './navigation';

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

  it('clears stale authReason when leaving auth-only routes', () => {
    expect(computeNavSearch('mode=auth&returnTo=results&authReason=reminder', 'home')).toBe('');
    expect(computeNavSearch('authReason=reminder', 'leaderboard')).toBe('mode=leaderboard');
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

  it('preserves from=app when navigating to home', () => {
    expect(computeNavSearch('mode=game&from=app', 'home')).toBe('from=app');
  });

  it('preserves from=app when navigating to another screen', () => {
    expect(computeNavSearch('from=app', 'leaderboard')).toBe('from=app&mode=leaderboard');
  });
});

describe('pathForScreen / screenFromPathname', () => {
  it('maps home to / and screens to /<screen>', () => {
    expect(pathForScreen('home')).toBe('/');
    expect(pathForScreen('results')).toBe('/results');
  });
  it('reads the screen back from a pathname (trailing slash tolerant)', () => {
    expect(screenFromPathname('/')).toBe('home');
    expect(screenFromPathname('/results')).toBe('results');
    expect(screenFromPathname('/archive/')).toBe('archive');
    expect(screenFromPathname('/unknown')).toBe('home');
  });
});

describe('buildTo (path + preserved query per screen)', () => {
  it('clears returnTo/authReason when going home', () => {
    expect(buildTo('home', '?returnTo=results&authReason=reminder')).toEqual({ pathname: '/', search: '' });
  });
  it('has no query for a bare non-home screen', () => {
    expect(buildTo('leaderboard', '')).toEqual({ pathname: '/leaderboard', search: '' });
  });
  it('preserves returnTo only for the auth screen', () => {
    expect(buildTo('auth', '?returnTo=results')).toEqual({ pathname: '/auth', search: '?returnTo=results' });
    expect(buildTo('groups', '?returnTo=results')).toEqual({ pathname: '/groups', search: '' });
  });
  it('clears stale authReason when leaving auth-only routes', () => {
    expect(buildTo('leaderboard', '?authReason=reminder')).toEqual({ pathname: '/leaderboard', search: '' });
  });
  it('keeps practice context on game and results', () => {
    expect(buildTo('results', '?date=2026-06-22&practice=1')).toEqual({
      pathname: '/results', search: '?date=2026-06-22&practice=1',
    });
  });
  it('drops practice context (date + practice) leaving practice for home', () => {
    expect(buildTo('home', '?date=2026-06-22&practice=1')).toEqual({ pathname: '/', search: '' });
  });
  it('drops practice context leaving practice for any non-game/results screen', () => {
    expect(buildTo('leaderboard', '?date=2026-06-22&practice=1')).toEqual({ pathname: '/leaderboard', search: '' });
  });
  it('clears a stale archiveDate when navigating away', () => {
    expect(buildTo('home', '?returnTo=archive&archiveDate=2026-06-22')).toEqual({ pathname: '/', search: '' });
  });
  it('does NOT strip a date override when not in practice (lab mode)', () => {
    expect(buildTo('home', '?date=2026-06-10')).toEqual({ pathname: '/', search: '?date=2026-06-10' });
  });
  it('preserves from=app going home', () => {
    expect(buildTo('home', '?from=app')).toEqual({ pathname: '/', search: '?from=app' });
  });
  it('preserves from=app going to another screen', () => {
    expect(buildTo('leaderboard', '?from=app')).toEqual({ pathname: '/leaderboard', search: '?from=app' });
  });
});

describe('legacyRedirect (?mode= → path)', () => {
  it('returns null when there is no mode param', () => {
    expect(legacyRedirect('?from=app')).toBeNull();
  });
  it('redirects a known mode to its path, dropping mode and keeping other params', () => {
    expect(legacyRedirect('?mode=results&date=2026-06-22&practice=1')).toEqual({
      pathname: '/results', search: '?date=2026-06-22&practice=1',
    });
  });
  it('maps an unknown mode to home', () => {
    expect(legacyRedirect('?mode=bogus')).toEqual({ pathname: '/', search: '' });
  });
});
