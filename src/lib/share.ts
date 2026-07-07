import type { RoundResult } from '../types';
import { getResultColor, getResultEmoji } from '../engine/scoring';

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
): string {
  const base = sport === 'soccer' ? 'Rewind ⚽' : 'Rewind';
  const title = archive ? (sport === 'soccer' ? 'Rewind Archive ⚽' : 'Rewind Archive') : base;
  const puzzleLabel = String(puzzleNumber).padStart(3, '0');

  const emojiRow = results
    .map((r) => getResultEmoji(getResultColor(r.diff)))
    .join('');

  let text = `⏪ ${title} #${puzzleLabel} – Guess 5 NBA moments by year\n`;
  text += `${emojiRow}\n\n`;
  text += `Top this. ${getPublicAppUrl()}`;
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
