import { describe, test, expect } from 'vitest';
import { MESSI_SPECIAL, SPECIAL_DAYS, getSpecialForDate, computeSpecialRedirect } from './specials';

describe('specials registry', () => {
  test('getSpecialForDate returns the Messi special on its date', () => {
    expect(getSpecialForDate('2026-07-15')?.slug).toBe('messi');
  });

  test('getSpecialForDate returns null on other dates', () => {
    expect(getSpecialForDate('2026-07-14')).toBeNull();
    expect(getSpecialForDate('2026-07-16')).toBeNull();
  });

  test('kill switch: disabled specials are not returned', () => {
    const disabled = { ...MESSI_SPECIAL, enabled: false };
    const days = SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, disabled);
    try {
      expect(getSpecialForDate('2026-07-15')).toBeNull();
    } finally {
      SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, ...days);
    }
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

  test('before and on the day → home', () => {
    expect(computeSpecialRedirect('/messi', '2026-07-14')).toBe('/');
    expect(computeSpecialRedirect('/messi', '2026-07-15')).toBe('/');
  });

  test('after the day → archive', () => {
    expect(computeSpecialRedirect('/messi', '2026-07-16')).toBe('/?mode=archive');
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
