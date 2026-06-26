import { RESET_TIME_ZONE, getTodayString } from './date';

/**
 * Milliseconds from `now` until the next daily reset (00:00 in RESET_TIME_ZONE).
 * Works by finding the wall-clock time elapsed since Pacific midnight and
 * subtracting from 24h.
 */
export function msToNextReset(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: RESET_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  // '24' can appear at midnight in some engines; normalize to 0.
  const hours = get('hour') % 24;
  const elapsedMs =
    hours * 3_600_000 + get('minute') * 60_000 + get('second') * 1_000 + now.getMilliseconds();
  const DAY = 24 * 60 * 60 * 1000;
  const remaining = DAY - elapsedMs;
  // At exactly midnight elapsedMs is 0 → remaining is a full day.
  return remaining === 0 ? DAY : remaining;
}

/** Format milliseconds as HH:MM:SS (zero-padded, negatives clamped to zero). */
export function formatCountdown(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Re-export so callers can derive the puzzle's "today" consistently.
export { getTodayString };
