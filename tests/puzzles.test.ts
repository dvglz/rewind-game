import { describe, it, expect } from 'vitest';
import { getPuzzleForDate, type Puzzle } from '../src/data/puzzles';

describe('getPuzzleForDate', () => {
  it('returns a puzzle with 5 events', () => {
    const puzzle = getPuzzleForDate('2026-06-03');
    expect(puzzle.events).toHaveLength(5);
  });

  it('each event has text and year between 1996-2026', () => {
    const puzzle = getPuzzleForDate('2026-06-03');
    for (const event of puzzle.events) {
      expect(event.text).toBeTruthy();
      expect(event.year).toBeGreaterThanOrEqual(1996);
      expect(event.year).toBeLessThanOrEqual(2026);
    }
  });

  it('returns same puzzle for same date', () => {
    const a = getPuzzleForDate('2026-06-03');
    const b = getPuzzleForDate('2026-06-03');
    expect(a.id).toBe(b.id);
  });

  it('returns different puzzle for different date', () => {
    const a = getPuzzleForDate('2026-06-03');
    const b = getPuzzleForDate('2026-06-04');
    expect(a.id).not.toBe(b.id);
  });
});
