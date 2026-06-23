import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ArchiveScreen } from './ArchiveScreen';

vi.mock('../lib/date', () => ({ getTodayString: () => '2026-06-22' }));

beforeEach(() => {
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

test('tapping a row plays that date', () => {
  const onPlayPast = vi.fn();
  render(<ArchiveScreen onBack={() => {}} onPlayPast={onPlayPast} />);
  fireEvent.click(screen.getAllByRole('button', { name: /Play #/ })[0]);
  expect(onPlayPast).toHaveBeenCalledWith('2026-06-21');
});
