import type { PuzzleSpecial, RoundResult } from '../types';
import { getResultColor, getResultEmoji } from '../engine/scoring';
import { formatTime } from './formatTime';

export type ShareOutcome = 'shared' | 'copied' | 'failed';

const PUBLIC_APP_URL =
  ((import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) || '').trim() ||
  'https://clutchpoints-rewind-test.4taps.me';

function withProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function getPublicAppUrl(): string {
  return withProtocol(PUBLIC_APP_URL).replace(/\/+$/, '');
}

export function generateShareText(
  puzzleNumber: number,
  results: RoundResult[],
  _totalScore: number,
  _maxScore: number,
  _streak: number,
  sport: 'american' | 'soccer' = 'american',
  _date?: string,
  archive = false,
  elapsedMs = 0,
  special?: PuzzleSpecial,
): string {
  const puzzleLabel = String(puzzleNumber).padStart(3, '0');

  const emojiRow = results
    .map((r) => getResultEmoji(getResultColor(r.diff)))
    .join('');

  if (special) {
    let text = `⏪ Rewind #${puzzleLabel} ${special.flag} ${special.label}\n`;
    text += `${special.shareLine}\n`;
    text += `${emojiRow} in ${formatTime(elapsedMs)}\n`;
    text += `Can you beat it? ${getPublicAppUrl()}/${special.slug}`;
    return text;
  }

  const base = sport === 'soccer' ? 'Rewind ⚽' : 'Rewind';
  const title = archive ? (sport === 'soccer' ? 'Rewind Archive ⚽' : 'Rewind Archive') : base;

  let text = `⏪ ${title} #${puzzleLabel}\n`;
  text += `Guess 5 NBA moments by year\n`;
  text += `${emojiRow} in ${formatTime(elapsedMs)}\n`;
  text += `Can you beat it? ${getPublicAppUrl()}`;
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

  // Native share shines on phones/tablets, but on desktop (notably Windows
  // Chrome/Edge) the OS share flyout often resolves as success when dismissed,
  // leaving nothing on the clipboard. Only offer it when the primary pointer is
  // coarse (touch); everything else copies to the clipboard instead.
  const preferNativeShare =
    window.isSecureContext &&
    typeof navigator.share === 'function' &&
    !!window.matchMedia?.('(pointer: coarse)').matches;

  if (preferNativeShare) {
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
