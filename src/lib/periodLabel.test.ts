import { describe, it, expect } from 'vitest';
import { periodLabel } from './periodLabel';

describe('periodLabel', () => {
  it('anchors offset 0 on This Week / This Month with the range as subLabel', () => {
    expect(periodLabel('weekly', 0, '2026-07-14', '2026-07-20')).toEqual({ label: 'This Week', subLabel: 'Jul 14 – Jul 20' });
    expect(periodLabel('monthly', 0, '2026-07-01')).toEqual({ label: 'This Month', subLabel: 'July 2026' });
  });

  it('shows the real range/month over two lines for past periods', () => {
    expect(periodLabel('weekly', 1, '2026-07-07', '2026-07-13')).toEqual({ label: 'Jul 7 – Jul 13', subLabel: '2026' });
    expect(periodLabel('monthly', 1, '2026-06-01')).toEqual({ label: 'June', subLabel: '2026' });
  });

  it('never renders an "N ago" placeholder when dates are missing (loading)', () => {
    expect(periodLabel('weekly', 3)).toEqual({ label: '' });
    expect(periodLabel('monthly', 5)).toEqual({ label: '' });
    // offset 0 still anchors on the friendly label even before dates load
    expect(periodLabel('weekly', 0)).toEqual({ label: 'This Week' });
    expect(periodLabel('monthly', 0)).toEqual({ label: 'This Month' });
  });

  it('returns an empty label for daily (DateSelector computes its own)', () => {
    expect(periodLabel('daily', 0, '2026-07-21', '2026-07-21')).toEqual({ label: '' });
  });
});
