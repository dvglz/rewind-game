import { describe, it, expect } from 'vitest';
import type { RoundResult } from '../types';
import { evaluateMissions } from './missions';

// diff drives the color: green = perfect = 0 only; any non-zero diff is not green.
function round(diff: number): RoundResult {
  return {
    event: { text: 'e', year: 2000 },
    guessedYear: 2000 + diff,
    actualYear: 2000,
    diff,
    score: 0,
  };
}

describe('evaluateMissions', () => {
  it('always awards participant on a completed run', () => {
    expect(evaluateMissions(0, [round(9), round(9), round(9), round(9), round(9)]))
      .toEqual(['participant']);
  });

  it('awards mission_2 at exactly 500', () => {
    const earned = evaluateMissions(500, [round(9), round(9), round(9), round(9), round(9)]);
    expect(earned).toContain('mission_2');
  });

  it('does not award mission_2 at 499', () => {
    const earned = evaluateMissions(499, [round(9), round(9), round(9), round(9), round(9)]);
    expect(earned).not.toContain('mission_2');
  });

  it('awards mission_3 when all 5 rounds are exact (perfect)', () => {
    const earned = evaluateMissions(0, [round(0), round(0), round(0), round(0), round(0)]);
    expect(earned).toContain('mission_3');
  });

  it('does not award mission_3 when one round is even 1 year off', () => {
    const earned = evaluateMissions(0, [round(0), round(0), round(0), round(0), round(1)]);
    expect(earned).not.toContain('mission_3');
  });

  it('does not award mission_3 with fewer than 5 rounds', () => {
    const earned = evaluateMissions(0, [round(0), round(0), round(0), round(0)]);
    expect(earned).not.toContain('mission_3');
  });
});
