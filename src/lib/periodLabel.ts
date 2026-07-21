import type { LeaderboardPeriod } from '../config/leaderboard';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function shortDate(iso: string): string {
  const d = parse(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Primary + secondary lines for the period stepper. `offset` 0 = current. */
export function periodLabel(
  period: LeaderboardPeriod,
  offset: number,
  startDate?: string,
  endDate?: string,
): { label: string; subLabel?: string } {
  if (period === 'weekly') {
    if (offset === 0) {
      return { label: 'This Week', subLabel: startDate && endDate ? `${shortDate(startDate)} – ${shortDate(endDate)}` : undefined };
    }
    if (startDate && endDate) return { label: `${shortDate(startDate)} – ${shortDate(endDate)}` };
    return { label: `${offset} week${offset > 1 ? 's' : ''} ago` };
  }
  if (period === 'monthly') {
    if (offset === 0) {
      return { label: 'This Month', subLabel: startDate ? `${MONTHS[parse(startDate).getUTCMonth()]} ${parse(startDate).getUTCFullYear()}` : undefined };
    }
    if (startDate) return { label: `${MONTHS[parse(startDate).getUTCMonth()]} ${parse(startDate).getUTCFullYear()}` };
    return { label: `${offset} month${offset > 1 ? 's' : ''} ago` };
  }
  return { label: '' }; // daily uses DateSelector's own computed label
}
