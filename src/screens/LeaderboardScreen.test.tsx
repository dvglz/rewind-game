import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { LeaderboardScreen } from './LeaderboardScreen';
import { AuthProvider } from '../context/AuthContext';

const { fetchLeaderboardMock } = vi.hoisted(() => ({
  fetchLeaderboardMock: vi.fn(async (dayOffset: number) => ({
    date: dayOffset === 0 ? '2026-06-11' : '2026-06-10',
    hasPrevious: dayOffset === 0,
    currentUser: { rank: 34, displayName: 'You', score: 410, timeMs: 159000, isCurrentUser: true },
    entries: [
      { rank: 1, displayName: 'Mike', score: 940, timeMs: 72000, isCurrentUser: false },
      { rank: 2, displayName: 'Sarah', score: 670, timeMs: 131000, isCurrentUser: false },
    ],
  })),
}));

vi.mock('../lib/leaderboard', () => ({
  fetchLeaderboard: fetchLeaderboardMock,
}));

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
