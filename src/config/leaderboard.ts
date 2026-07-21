/** Maximum number of ranked rows shown on the global leaderboard page. */
export const LEADERBOARD_PAGE_LIMIT = 20;

/** Leaderboard time periods. Backend supports daily/weekly/monthly only.
 *  Add `{ id: 'alltime', label: 'All-time' }` here when the backend exposes it
 *  (and widen `LeaderboardPeriod`). */
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';

export const LEADERBOARD_PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const DEFAULT_LEADERBOARD_PERIOD: LeaderboardPeriod = 'daily';
