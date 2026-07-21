import type { LeaderboardPeriod } from '../config/leaderboard';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function shortDate(iso: string): string {
  const d = parse(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Primary + secondary lines for the period stepper. `offset` 0 = current.
 *  offset 0 always anchors on "This Week" / "This Month". Past periods show the
 *  real date range / month once the board's dates load; while loading (no dates
 *  yet) they render blank rather than a "N ago" placeholder — the stepper
 *  reserves a fixed height so nothing shifts. */
export function periodLabel(
  period: LeaderboardPeriod,
  offset: number,
  startDate?: string,
  endDate?: string,
): { label: string; subLabel?: string } {
  if (period === 'weekly') {
    if (startDate && endDate) {
      const range = `${shortDate(startDate)} – ${shortDate(endDate)}`;
      return offset === 0
        ? { label: 'This Week', subLabel: range }
        : { label: range, subLabel: String(parse(startDate).getUTCFullYear()) };
    }
    return offset === 0 ? { label: 'This Week' } : { label: '' };
  }
  if (period === 'monthly') {
    if (startDate) {
      const d = parse(startDate);
      const month = MONTHS[d.getUTCMonth()];
      const year = String(d.getUTCFullYear());
      return offset === 0
        ? { label: 'This Month', subLabel: `${month} ${year}` }
        : { label: month, subLabel: year };
    }
    return offset === 0 ? { label: 'This Month' } : { label: '' };
  }
  return { label: '' }; // daily uses DateSelector's own computed label
}
