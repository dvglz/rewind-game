export const HIGH_SCORE_RATIO = 0.8;
export const RESET_URGENCY_MS = 2 * 60 * 60 * 1000;

export interface ClaimAskInput {
  isAuthenticated: boolean;
  totalScore: number;
  maxScore: number;
  msToReset: number;
}

export interface ClaimAsk {
  headline: string;
  urgency: string | null;
}

/**
 * Pick the rank "claim" copy for the results screen. Authenticated users get no
 * ask (null). Logged-out users get a claim headline that amplifies on a high
 * score, plus an optional urgency line near the daily reset.
 */
export function getClaimAsk(input: ClaimAskInput): ClaimAsk | null {
  if (input.isAuthenticated) return null;
  const isHighScore = input.maxScore > 0 && input.totalScore / input.maxScore >= HIGH_SCORE_RATIO;
  const headline = isHighScore ? 'Top score — claim your rank' : 'Claim your rank';
  const urgency = input.msToReset < RESET_URGENCY_MS ? 'Today’s board locks soon' : null;
  return { headline, urgency };
}
