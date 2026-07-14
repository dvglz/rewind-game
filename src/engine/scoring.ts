import type { ResultColor } from '../types';

export const ROUND_WEIGHTS = [100, 100, 200, 300, 300] as const;
const SCORE_FACTORS = [1, 0.82, 0.72, 0.64, 0.57, 0.5, 0.42, 0.35, 0.29] as const;

export type RoundWeights = readonly number[];

function getRoundWeight(roundIndex: number, weights: RoundWeights = ROUND_WEIGHTS): number {
  return weights[roundIndex] ?? weights[weights.length - 1] ?? 0;
}

export function calculateScore(diff: number, roundIndex = 0, weights: RoundWeights = ROUND_WEIGHTS): number {
  const absDiff = Math.abs(diff);
  const factor = SCORE_FACTORS[absDiff] ?? 0.2;
  return Math.round(getRoundWeight(roundIndex, weights) * factor);
}

export function getMaxPossibleScore(rounds: number, weights: RoundWeights = ROUND_WEIGHTS): number {
  return Array.from({ length: rounds }, (_, i) => getRoundWeight(i, weights))
    .reduce((sum, weight) => sum + weight, 0);
}

export function normalizePuzzleScore(totalScore: number, rounds: number, weights: RoundWeights = ROUND_WEIGHTS): number {
  if (rounds <= 0) return 0;
  return Math.min(Math.round(totalScore), getMaxPossibleScore(rounds, weights));
}

export function getResultColor(diff: number): ResultColor {
  const absDiff = Math.abs(diff);
  if (absDiff === 0) return 'perfect';
  if (absDiff <= 3) return 'ballpark';
  if (absDiff <= 6) return 'wrong-era';
  return 'not-even-close';
}

export function getResultEmoji(color: ResultColor): string {
  switch (color) {
    case 'perfect':
      return '🟢';
    case 'ballpark':
      return '🟡';
    case 'wrong-era':
      return '🟠';
    case 'not-even-close':
      return '🔴';
  }
}

export function getResultLabel(color: ResultColor): string {
  switch (color) {
    case 'perfect':
      return 'Perfect';
    case 'ballpark':
      return 'Ballpark';
    case 'wrong-era':
      return 'Wrong Era';
    case 'not-even-close':
      return 'Way Off';
  }
}

export function getAccuracyLabel(diff: number): string {
  if (diff === 0) return 'Perfect';
  const absDiff = Math.abs(diff);
  const unit = absDiff === 1 ? 'yr' : 'yrs';
  const direction = diff > 0 ? 'late' : 'early';
  return `${absDiff}${unit} ${direction}`;
}

export function getScoreTierLabel(totalScore: number, maxScore: number): string {
  if (maxScore <= 0) return 'Not bad';
  const pct = totalScore / maxScore;
  if (pct >= 1) return 'Perfect!';
  if (pct >= 0.8) return 'Incredible!';
  if (pct >= 0.6) return 'Impressive!';
  if (pct >= 0.4) return 'Not bad';
  return 'Better luck tomorrow';
}

export function getResultColorVar(color: ResultColor): string {
  switch (color) {
    case 'perfect':
      return 'var(--color-correct)';
    case 'ballpark':
      return 'var(--color-close)';
    case 'wrong-era':
      return 'var(--color-wrong-era)';
    case 'not-even-close':
      return 'var(--color-wrong)';
  }
}
