import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initAnalytics, track, trackPageView, setUser, clearUser } from './analytics';

const entries = () =>
  (window.dataLayer ?? []).map((e) => Array.from(e as unknown as IArguments));
const last = () => entries()[entries().length - 1];

describe('analytics (enabled)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    window.dataLayer = [];
    window.__gaInit = false;
    initAnalytics();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('track pushes an event entry', () => {
    track('game_complete', { total_score: 1200 });
    expect(last()).toEqual(['event', 'game_complete', { total_score: 1200 }]);
  });

  it('trackPageView maps a screen to a page_path', () => {
    trackPageView('game');
    expect(last()).toEqual(['event', 'page_view', { page_path: '/game', page_title: 'game' }]);
  });

  it('trackPageView maps home to root', () => {
    trackPageView('home');
    expect(last()).toEqual(['event', 'page_view', { page_path: '/', page_title: 'home' }]);
  });

  it('setUser sets user_id and user_properties', () => {
    setUser({ user_id: 2641032, is_authenticated: true, auth_method: 'email' });
    expect(entries()).toContainEqual(['set', { user_id: '2641032' }]);
    expect(entries()).toContainEqual([
      'set',
      'user_properties',
      { is_authenticated: true, auth_method: 'email' },
    ]);
  });

  it('clearUser resets identity', () => {
    clearUser();
    expect(entries()).toContainEqual(['set', { user_id: null }]);
    expect(entries()).toContainEqual([
      'set',
      'user_properties',
      { is_authenticated: false, auth_method: null },
    ]);
  });
});

describe('analytics (disabled — no measurement id)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    window.dataLayer = [];
    window.__gaInit = false;
  });
  afterEach(() => vi.unstubAllEnvs());

  it('initAnalytics is a no-op', () => {
    initAnalytics();
    expect(window.dataLayer).toEqual([]);
  });

  it('track is a no-op', () => {
    track('game_complete', { total_score: 1 });
    expect(window.dataLayer).toEqual([]);
  });
});
