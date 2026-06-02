import type { RoundResult } from '../types';
import { getResultColor, getResultEmoji } from '../engine/scoring';

export function generateShareText(
  puzzleNumber: number,
  results: RoundResult[],
  totalScore: number,
  streak: number,
  sport: 'nba' | 'soccer' = 'nba',
): string {
  const sportEmoji = sport === 'soccer' ? '⚽' : '🏀';

  const emojiRow = results
    .map((r) => getResultEmoji(getResultColor(r.diff)))
    .join(' ');

  const diffRow = results
    .map((r) => {
      if (r.diff === 0) return ' 0';
      return r.diff > 0 ? `+${r.diff}` : `${r.diff}`;
    })
    .join('  ');

  let text = `${sportEmoji} Rewind #${String(puzzleNumber).padStart(3, '0')}\n\n`;
  text += `${emojiRow}\n`;
  text += `${diffRow}\n\n`;
  text += `Score: ${totalScore.toLocaleString()}`;
  if (streak > 1) {
    text += `\n🔥 ${streak}-day streak`;
  }
  text += `\n\nplayrewind.com`;
  return text;
}

export async function shareResults(text: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return true;
    } catch {
      // User cancelled or share failed
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
