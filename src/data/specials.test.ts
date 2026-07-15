import { describe, test, expect, afterEach } from 'vitest';
import {
  MESSI_SPECIAL,
  SPECIAL_DAYS,
  getSpecialBySlug,
  getActiveSpecial,
  getBannerSpecial,
  isSpecialScoringLive,
  computeSpecialRedirect,
} from './specials';

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('specials registry', () => {
  test('getSpecialBySlug returns the enabled Messi special', () => {
    expect(getSpecialBySlug('messi')?.date).toBe('2026-07-14');
    expect(getSpecialBySlug('unknown')).toBeNull();
  });

  test('getActiveSpecial reads the ?special= param', () => {
    expect(getActiveSpecial()).toBeNull();
    window.history.replaceState({}, '', '/?special=messi');
    expect(getActiveSpecial()?.slug).toBe('messi');
    window.history.replaceState({}, '', '/?special=nope');
    expect(getActiveSpecial()).toBeNull();
  });

  test('kill switch: disabled specials are invisible to slug/param/banner lookups', () => {
    const disabled = { ...MESSI_SPECIAL, enabled: false };
    const days = SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, disabled);
    try {
      window.history.replaceState({}, '', '/?special=messi');
      expect(getSpecialBySlug('messi')).toBeNull();
      expect(getActiveSpecial()).toBeNull();
      expect(getBannerSpecial('2026-07-15')).toBeNull();
    } finally {
      SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, ...days);
    }
  });

  test('banner shows only during the live window', () => {
    expect(getBannerSpecial('2026-07-13')).toBeNull();
    expect(getBannerSpecial('2026-07-14')?.slug).toBe('messi');
    expect(getBannerSpecial('2026-07-15')?.slug).toBe('messi');
    expect(getBannerSpecial('2026-07-16')?.slug).toBe('messi');
    expect(getBannerSpecial('2026-07-17')).toBeNull();
  });

  test('special scoring is live only during the window', () => {
    expect(isSpecialScoringLive(MESSI_SPECIAL, '2026-07-13')).toBe(false);
    expect(isSpecialScoringLive(MESSI_SPECIAL, '2026-07-14')).toBe(true);
    expect(isSpecialScoringLive(MESSI_SPECIAL, '2026-07-15')).toBe(true);
    expect(isSpecialScoringLive(MESSI_SPECIAL, '2026-07-16')).toBe(true);
    expect(isSpecialScoringLive(MESSI_SPECIAL, '2026-07-17')).toBe(false);
  });

  test('Messi special declares its own PlayHub game mode', () => {
    expect(MESSI_SPECIAL.gameMode).toBe('rewind_messi');
  });

  test('Messi special has exactly 10 events with unique ascending years and weights summing to 1000', () => {
    expect(MESSI_SPECIAL.events).toHaveLength(10);
    expect(MESSI_SPECIAL.weights).toHaveLength(10);
    expect(MESSI_SPECIAL.weights.reduce((a, b) => a + b, 0)).toBe(1000);
    const years = MESSI_SPECIAL.events.map((e) => Number(e.date.slice(0, 4)));
    expect(new Set(years).size).toBe(10);
    expect(years).toEqual([...years].sort((a, b) => a - b)); // chronological journey
  });

  test('every event has id, title, date, reveal', () => {
    for (const e of MESSI_SPECIAL.events) {
      expect(e.id).toMatch(/^evt_messi_/);
      expect(e.title.length).toBeGreaterThan(10);
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.reveal.startsWith('In ')).toBe(true);
    }
  });

  test('all media entries are complete and point at bundled assets', () => {
    for (const e of MESSI_SPECIAL.events) {
      if (!e.media) continue;
      expect(e.media.src).toMatch(/^\/specials\/messi\/\d{2}-[a-z-]+\.jpg$/);
      expect(e.media.caption.length).toBeGreaterThan(10);
      expect(e.media.credit).toMatch(/^Photo: .+, via Wikimedia Commons$/);
      expect(e.media.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });
});

describe('computeSpecialRedirect', () => {
  test('non-special paths are ignored', () => {
    expect(computeSpecialRedirect('/', '2026-07-15')).toBeNull();
    expect(computeSpecialRedirect('/groups', '2026-07-15')).toBeNull();
  });

  test('before the day → plain home (no leak)', () => {
    expect(computeSpecialRedirect('/messi', '2026-07-13')).toBe('/');
  });

  test('on and after the day → activates special mode', () => {
    expect(computeSpecialRedirect('/messi', '2026-07-14')).toBe('/?special=messi');
    expect(computeSpecialRedirect('/messi', '2026-07-16')).toBe('/?special=messi');
  });

  test('disabled special → home regardless of date', () => {
    const disabled = { ...MESSI_SPECIAL, enabled: false };
    const days = SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, disabled);
    try {
      expect(computeSpecialRedirect('/messi', '2026-07-16')).toBe('/');
    } finally {
      SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, ...days);
    }
  });
});

describe('multi-day live window (endDate)', () => {
  const extended = { ...MESSI_SPECIAL, endDate: '2026-07-18' };

  test('window closes after endDate', () => {
    expect(getBannerSpecial('2026-07-17')).toBeNull();
    expect(isSpecialScoringLive(MESSI_SPECIAL, '2026-07-17')).toBe(false);
  });

  test('extending endDate opens the extra days, and no more', () => {
    const days = SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, extended);
    try {
      expect(getBannerSpecial('2026-07-17')?.slug).toBe('messi');
      expect(getBannerSpecial('2026-07-18')?.slug).toBe('messi');
      expect(getBannerSpecial('2026-07-19')).toBeNull();
      expect(isSpecialScoringLive(extended, '2026-07-18')).toBe(true);
      expect(isSpecialScoringLive(extended, '2026-07-19')).toBe(false);
    } finally {
      SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, ...days);
    }
  });
});
