import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { LeaderboardScreen } from './LeaderboardScreen';

vi.mock('../lib/leaderboard', () => ({
  fetchLeaderboard: vi.fn(async () => ({
    date: '2026-06-11',
    currentUser: { rank: 34, displayName: 'You', score: 410, timeMs: 159000, isCurrentUser: true },
    entries: [
      { rank: 1, displayName: 'Mike', score: 940, timeMs: 72000, isCurrentUser: false },
      { rank: 2, displayName: 'Sarah', score: 670, timeMs: 131000, isCurrentUser: false },
    ],
  })),
}));

test('renders the title and a pinned row for an out-of-page user', async () => {
  render(<LeaderboardScreen onBack={() => {}} />);

  expect(await screen.findByRole('heading', { name: 'Leaderboard' })).not.toBeNull();
  // Pinned "You" row (rank 34 is outside the 2-row mock page).
  expect(await screen.findByText('34')).not.toBeNull();
  expect(await screen.findByText('You')).not.toBeNull();
  // Run time formatted next to the pinned user (159000ms -> "2m 39s").
  expect(await screen.findByText('2m 39s')).not.toBeNull();
});
