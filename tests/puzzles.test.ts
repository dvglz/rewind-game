import { afterEach, describe, it, expect, vi } from 'vitest';
import { getDateOverride, getPuzzleForDate } from '../src/data/puzzles';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  window.history.replaceState({}, '', '/');
});

describe('getPuzzleForDate', () => {
  it('returns a puzzle with 5 events for nba', () => {
    const puzzle = getPuzzleForDate('2026-06-03', 'american');
    expect(puzzle.events).toHaveLength(5);
  });

  it('returns a puzzle with 5 events for soccer', () => {
    const puzzle = getPuzzleForDate('2026-06-03', 'soccer');
    expect(puzzle.events).toHaveLength(5);
  });

  it('each event has text and year', () => {
    const puzzle = getPuzzleForDate('2026-06-03', 'american');
    for (const event of puzzle.events) {
      expect(event.text).toBeTruthy();
      expect(event.year).toBeGreaterThanOrEqual(1930);
      expect(event.year).toBeLessThanOrEqual(2026);
    }
  });

  it('returns same puzzle for same date and sport', () => {
    const a = getPuzzleForDate('2026-06-03', 'american');
    const b = getPuzzleForDate('2026-06-03', 'american');
    expect(a.id).toBe(b.id);
    expect(a.events.map(e => e.text)).toEqual(b.events.map(e => e.text));
  });

  it('returns different puzzle for different date', () => {
    const a = getPuzzleForDate('2026-06-03', 'american');
    const b = getPuzzleForDate('2026-06-04', 'american');
    expect(a.events.map(e => e.text)).not.toEqual(b.events.map(e => e.text));
  });

  it('returns different puzzle for different sport', () => {
    const a = getPuzzleForDate('2026-06-03', 'american');
    const b = getPuzzleForDate('2026-06-03', 'soccer');
    expect(a.id).not.toBe(b.id);
  });

  it('consecutive dates get different day sets', () => {
    const days = Array.from({ length: 10 }, (_, i) => {
      const d = String(i + 1).padStart(2, '0');
      return getPuzzleForDate(`2026-06-${d}`, 'american').events.map(e => e.text);
    });
    // All 10 should be unique sets
    const unique = new Set(days.map(d => d.join('|')));
    expect(unique.size).toBe(10);
  });

  it('2026-06-16 (launch) maps to Day 1 (LeBron for nba)', () => {
    const puzzle = getPuzzleForDate('2026-06-16', 'american');
    expect(puzzle.events[0].text).toContain('LeBron');
    expect(puzzle.number).toBe(1);
  });

  it('2026-06-17 maps to Day 2 (Jordan for nba)', () => {
    const puzzle = getPuzzleForDate('2026-06-17', 'american');
    expect(puzzle.events[0].text).toContain('Jordan');
    expect(puzzle.number).toBe(2);
  });

  it('cycles back after pool size (10 days)', () => {
    const a = getPuzzleForDate('2026-06-06', 'american');
    const b = getPuzzleForDate('2026-06-16', 'american');
    expect(a.events.map(e => e.text)).toEqual(b.events.map(e => e.text));
  });

  it('works with any date', () => {
    const past = getPuzzleForDate('2020-01-15', 'american');
    expect(past.events).toHaveLength(5);

    const future = getPuzzleForDate('2030-12-25', 'soccer');
    expect(future.events).toHaveLength(5);
  });

  it('soccer day 1 Q3 uses South Africa hosting (not Saudi/Argentina)', () => {
    const puzzle = getPuzzleForDate('2026-06-16', 'soccer');
    // Q1 is Messi, Q3 should be South Africa (not Saudi)
    expect(puzzle.events[0].text).toContain('Messi');
    expect(puzzle.events[2].text).toContain('South Africa');
  });

  it('uses the real current date when there is no ?date= override', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-12T13:45:00Z'));

    expect(getDateOverride()).toBe('2026-06-12');
  });

  it('prefers the ?date= override when present', () => {
    window.history.replaceState({}, '', '/?date=2026-06-03');
    expect(getDateOverride()).toBe('2026-06-03');
  });
});
