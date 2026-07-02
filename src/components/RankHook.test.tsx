import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';

vi.mock('../lib/leaderboard', () => ({
  fetchLeaderboard: vi.fn(),
  getDayOffsetFromToday: vi.fn().mockReturnValue(0),
}));
vi.mock('../data/puzzles', () => ({
  getDateOverride: vi.fn().mockReturnValue('2026-06-24'),
}));
vi.mock('../lib/analytics', () => ({ track: vi.fn() }));

import { RankHook } from './RankHook';
import { fetchLeaderboard } from '../lib/leaderboard';
import { track } from '../lib/analytics';

beforeEach(() => {
  vi.mocked(fetchLeaderboard).mockReset();
  vi.mocked(track).mockReset();
});

test('logged-out: shows blurred claim CTA and routes to auth on tap', () => {
  const onClaim = vi.fn();
  render(<RankHook isAuthenticated={false} claimHeadline="Claim your rank" urgency={null} onClaim={onClaim} onOpenLeaderboard={() => {}} />);
  expect(screen.getByText('Claim your rank')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /claim your rank/i }));
  expect(onClaim).toHaveBeenCalledTimes(1);
});

test('authenticated: fetches and shows the real rank, links to leaderboard, fires rank_reveal', async () => {
  vi.mocked(fetchLeaderboard).mockResolvedValue({
    date: '2026-06-24', hasPrevious: false, entries: [],
    currentUser: { rank: 347, displayName: 'me', score: 5000, timeMs: 1000, isCurrentUser: true },
  });
  const onOpen = vi.fn();
  render(<RankHook isAuthenticated claimHeadline="Claim your rank" urgency={null} onClaim={() => {}} onOpenLeaderboard={onOpen} />);
  await waitFor(() => expect(screen.getByText(/#347/)).not.toBeNull());
  expect(track).toHaveBeenCalledWith('rank_reveal', { rank: 347 });
  fireEvent.click(screen.getByRole('button', { name: /#347/ }));
  expect(onOpen).toHaveBeenCalledTimes(1);
});
