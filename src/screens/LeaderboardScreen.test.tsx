import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { LeaderboardScreen } from './LeaderboardScreen';
import { AuthProvider } from '../context/AuthContext';

const { fetchLeaderboardMock, getDateOverrideMock, getDayOffsetFromTodayMock } = vi.hoisted(() => ({
  fetchLeaderboardMock: vi.fn(async (dayOffset: number) => ({
    date: dayOffset === 0 ? '2026-06-11' : '2026-06-10',
    hasPrevious: dayOffset === 0,
    currentUser: { rank: 34, displayName: 'You', score: 410, timeMs: 159000, isCurrentUser: true },
    entries: [
      { rank: 1, displayName: 'Mike', score: 940, timeMs: 72000, isCurrentUser: false },
      { rank: 2, displayName: 'Sarah', score: 670, timeMs: 131000, isCurrentUser: false },
    ],
  })),
  getDateOverrideMock: vi.fn(() => '2026-06-16'),
  getDayOffsetFromTodayMock: vi.fn(() => 0),
}));

vi.mock('../lib/leaderboard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/leaderboard')>();
  return {
    ...actual,
    fetchLeaderboard: fetchLeaderboardMock,
    getDayOffsetFromToday: getDayOffsetFromTodayMock,
  };
});

vi.mock('../data/puzzles', () => ({
  getDateOverride: getDateOverrideMock,
}));

beforeEach(() => {
  fetchLeaderboardMock.mockClear();
  getDateOverrideMock.mockReset();
  getDateOverrideMock.mockReturnValue('2026-06-16');
  getDayOffsetFromTodayMock.mockReset();
  getDayOffsetFromTodayMock.mockReturnValue(0);
});

test('renders the title and a pinned row for an out-of-page user', async () => {
  render(
    <AuthProvider>
      <LeaderboardScreen onBack={() => {}} />
    </AuthProvider>,
  );

  expect(await screen.findByRole('heading', { name: 'Leaderboard' })).not.toBeNull();
  // Pinned "You" row (rank 34 is outside the 2-row mock page).
  expect(await screen.findByText('34')).not.toBeNull();
  expect(await screen.findByText('You')).not.toBeNull();
  // Run time formatted next to the pinned user (159000ms -> "2m 39s").
  expect(await screen.findByText('2m 39s')).not.toBeNull();
});

test('disables previous-day navigation when the current board has no earlier history', async () => {
  render(
    <AuthProvider>
      <LeaderboardScreen onBack={() => {}} />
    </AuthProvider>,
  );

  await screen.findByRole('heading', { name: 'Leaderboard' });

  const previousButton = screen.getByRole('button', { name: 'Previous day' });
  expect((previousButton as HTMLButtonElement).disabled).toBe(false);

  fireEvent.click(previousButton);

  await waitFor(() => expect(fetchLeaderboardMock).toHaveBeenLastCalledWith(1));
  await waitFor(() => expect((previousButton as HTMLButtonElement).disabled).toBe(true));
});

test('anchors the first leaderboard view to the active puzzle date', async () => {
  getDateOverrideMock.mockReturnValue('2026-06-15');
  getDayOffsetFromTodayMock.mockReturnValue(1);

  render(
    <AuthProvider>
      <LeaderboardScreen onBack={() => {}} />
    </AuthProvider>,
  );

  await waitFor(() => expect(fetchLeaderboardMock).toHaveBeenCalledWith(1));
  expect(await screen.findByText('Today')).not.toBeNull();
  expect(screen.getByText('Jun 15, 2026')).not.toBeNull();
});
