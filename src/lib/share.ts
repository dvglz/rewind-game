import type { RoundResult } from '../types';
import { getResultColor, getResultEmoji } from '../engine/scoring';

export type ShareOutcome = 'shared' | 'copied' | 'failed';

export function generateShareText(
  puzzleNumber: number,
  results: RoundResult[],
  totalScore: number,
  maxScore: number,
  streak: number,
  sport: 'nba' | 'soccer' | 'mlb' = 'nba',
): string {
  const sportEmoji = sport === 'soccer' ? '⚽' : sport === 'mlb' ? '⚾' : '🏀';

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
  text += `Score: ${totalScore.toLocaleString()}/${maxScore.toLocaleString()}`;
  if (streak > 1) {
    text += `\n🔥 ${streak}-day streak`;
  }
  text += `\n\n${window.location.origin}${window.location.pathname}${window.location.search}`;
  return text;
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    document.body.removeChild(textarea);
    return false;
  }
}

export async function shareResults(text: string): Promise<ShareOutcome> {
  const shareData = {
    title: 'Rewind',
    text,
    url: `${window.location.origin}${window.location.pathname}${window.location.search}`,
  };

  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch {
      // fall through to clipboard copy
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return fallbackCopy(text) ? 'copied' : 'failed';
  }
}
