// The backend resets the daily game globally at 00:00 Pacific. The frontend's
// notion of "today" must roll over at the same instant, or for the hours
// between UTC midnight and Pacific midnight the client and server disagree on
// which day it is (wrong puzzle, mis-keyed scores, "already played" misfires).
export const RESET_TIME_ZONE = 'America/Los_Angeles';

/**
 * Current calendar date as `YYYY-MM-DD` in the backend's daily-reset timezone
 * (Pacific). Accepts an explicit `Date` for testing.
 */
export function getTodayString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: RESET_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
