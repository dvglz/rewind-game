import type { ResultColor } from '../types';

const MAX_SCORE = 1000;
const DECAY_RATE = 0.25;

export function calculateScore(diff: number): number {
  const absDiff = Math.abs(diff);
  return Math.round(MAX_SCORE * Math.exp(-DECAY_RATE * absDiff));
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
