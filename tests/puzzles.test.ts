import { describe, it, expect } from 'vitest';
import { getPuzzleForDate } from '../src/data/puzzles';

describe('getPuzzleForDate', () => {
  it('returns a puzzle with 5 events for NBA', () => {
    const puzzle = getPuzzleForDate('2026-06-03', 'nba');
    expect(puzzle.events).toHaveLength(5);
  });

  it('returns a puzzle with 5 events for soccer', () => {
    const puzzle = getPuzzleForDate('2026-06-03', 'soccer');
    expect(puzzle.events).toHaveLength(5);
  });

  it('each event has text and year', () => {
    const puzzle = getPuzzleForDate('2026-06-03', 'nba');
    for (const event of puzzle.events) {
      expect(event.text).toBeTruthy();
      expect(event.year).toBeGreaterThanOrEqual(1984);
      expect(event.year).toBeLessThanOrEqual(2026);
    }
  });

  it('returns same puzzle for same date and sport', () => {
    const a = getPuzzleForDate('2026-06-03', 'nba');
    const b = getPuzzleForDate('2026-06-03', 'nba');
    expect(a.id).toBe(b.id);
    expect(a.events.map(e => e.text)).toEqual(b.events.map(e => e.text));
  });

  it('returns different puzzle for different date', () => {
    const a = getPuzzleForDate('2026-06-03', 'nba');
    const b = getPuzzleForDate('2026-06-04', 'nba');
    expect(a.id).not.toBe(b.id);
  });

  it('returns different puzzle for different sport', () => {
    const a = getPuzzleForDate('2026-06-03', 'nba');
    const b = getPuzzleForDate('2026-06-03', 'soccer');
    expect(a.id).not.toBe(b.id);
  });
});
