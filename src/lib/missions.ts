import type { RoundResult } from '../types';
import { getResultColor } from '../engine/scoring';

export const MISSION_PARTICIPANT = 'participant';
export const MISSION_SCORE_500 = 'mission_2';
export const MISSION_FIVE_GREENS = 'mission_3';

const SCORE_500_THRESHOLD = 500;
const TOTAL_ROUNDS = 5;

function isGreen(result: RoundResult): boolean {
  return getResultColor(result.diff) === 'perfect';
}

/** Returns the reward keys earned by a completed daily run. */
export function evaluateMissions(totalScore: number, results: RoundResult[]): string[] {
  const earned: string[] = [MISSION_PARTICIPANT];
  if (totalScore >= SCORE_500_THRESHOLD) earned.push(MISSION_SCORE_500);
  if (results.length === TOTAL_ROUNDS && results.every(isGreen)) {
    earned.push(MISSION_FIVE_GREENS);
  }
  return earned;
}
