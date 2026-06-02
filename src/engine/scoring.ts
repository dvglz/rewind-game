import type { ResultColor } from '../types';

export const MAX_SCORE_PER_ROUND = 200;
const DECAY_RATE = 0.25;

export function calculateScore(diff: number): number {
  const absDiff = Math.abs(diff);
  return Math.round(MAX_SCORE_PER_ROUND * Math.exp(-DECAY_RATE * absDiff));
}

export function getMaxPossibleScore(rounds: number): number {
  return MAX_SCORE_PER_ROUND * rounds;
}

export function normalizePuzzleScore(totalScore: number, rounds: number): number {
  if (rounds <= 0) return 0;
  return Math.round(totalScore / rounds);
}

export function getResultColor(diff: number): ResultColor {
  const absDiff = Math.abs(diff);
  if (absDiff <= 1) return 'correct';
  if (absDiff <= 3) return 'close';
  return 'wrong';
}

export function getResultEmoji(color: ResultColor): string {
  switch (color) {
    case 'correct': return '🟩';
    case 'close': return '🟨';
    case 'wrong': return '🟥';
  }
}
