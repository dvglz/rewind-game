import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ArchiveScreen } from './ArchiveScreen';
import { MESSI_SPECIAL } from '../data/specials';

const today = vi.hoisted(() => ({ value: '2026-06-22' }));
vi.mock('../lib/date', () => ({ getTodayString: () => today.value }));

beforeEach(() => {
  today.value = '2026-06-22';
  window.history.replaceState({}, '', '/');
});

test('lists past days newest-first, capped at days since launch', () => {
  render(<ArchiveScreen onBack={() => {}} onPlayPast={() => {}} />);
  // Today is 2026-06-22 (Day 5). Past days: 06-21,06-20,06-19,06-18 = 4 rows.
  const rows = screen.getAllByRole('button', { name: /Play #/ });
  expect(rows).toHaveLength(4);
  expect(rows[0].textContent).toContain('#004'); // 06-21 = Day 4, newest first
  expect(rows[3].textContent).toContain('#001'); // 06-18 = Day 1 (launch)
});

test('shows every day back to launch, not just the last 10', () => {
  today.value = '2026-07-03'; // Day 16 → 15 past days, more than the old 10-day cap
  render(<ArchiveScreen onBack={() => {}} onPlayPast={() => {}} />);
  const rows = screen.getAllByRole('button', { name: /Play #/ });
  expect(rows).toHaveLength(15);
  expect(rows[0].textContent).toContain('#015'); // newest past day
  expect(rows[14].textContent).toContain('#001'); // launch day
});

test('tapping a row plays that date', () => {
  const onPlayPast = vi.fn();
  render(<ArchiveScreen onBack={() => {}} onPlayPast={onPlayPast} />);
  fireEvent.click(screen.getAllByRole('button', { name: /Play #/ })[0]);
  expect(onPlayPast).toHaveBeenCalledWith('2026-06-21');
});

test('archive shows the regular #028 row without a special flag (special is a parallel mode)', () => {
  today.value = '2026-07-16'; // one day after the 2026-07-15 special
  render(<ArchiveScreen onBack={() => {}} onPlayPast={() => {}} />);
  const rows = screen.getAllByRole('button', { name: /Play #/ });
  const jul15Row = rows.find((row) => row.textContent?.includes('#028'));
  expect(jul15Row?.textContent).toContain('#028');
  expect(jul15Row?.textContent).not.toContain(MESSI_SPECIAL.flag);
});
