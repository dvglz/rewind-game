import type { RoundResult } from '../types';
import { getResultColor, getResultEmoji } from '../engine/scoring';

export type ShareOutcome = 'shared' | 'copied' | 'failed';

export function generateShareText(
  puzzleNumber: number,
  results: RoundResult[],
  totalScore: number,
  maxScore: number,
  _streak: number,
  sport: 'american' | 'soccer' = 'american',
  date?: string,
): string {
  const title = sport === 'soccer' ? 'Rewind ⚽' : 'Rewind';
  const puzzleLabel = String(puzzleNumber).padStart(3, '0');
  const dateStr = new Date(`${date ?? new Date().toISOString().slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const emojiRow = results
    .map((r) => getResultEmoji(getResultColor(r.diff)))
    .join('');

  let text = `${title} #${puzzleLabel} / ${dateStr}\n`;
  text += `${emojiRow}\n`;
  text += `Score ${totalScore.toLocaleString()} / ${maxScore.toLocaleString()}\n\n`;
  text += `rewind.clutchpoints.com\n`;
  text += `Guess 5 sports moments by year.`;
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
    text,
  };

  if (window.isSecureContext && navigator.share) {
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
