import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { LeaderboardScreen } from './LeaderboardScreen';
import { AuthProvider } from '../context/AuthContext';
import { MESSI_SPECIAL, SPECIAL_DAYS } from '../data/specials';

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
  // Run time formatted next to the pinned user (159000ms -> "02:39").
  expect(await screen.findByText('02:39')).not.toBeNull();
});

test('wordmark navigates home via onBack', () => {
  const onBack = vi.fn();

  render(
    <AuthProvider>
      <LeaderboardScreen onBack={onBack} />
    </AuthProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'REWIND' }));

  expect(onBack).toHaveBeenCalledTimes(1);
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

  await waitFor(() => expect(fetchLeaderboardMock).toHaveBeenLastCalledWith(1, undefined, undefined));
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

  await waitFor(() => expect(fetchLeaderboardMock).toHaveBeenCalledWith(1, undefined, undefined));
  expect(await screen.findByText('Today')).not.toBeNull();
  expect(screen.getByText('Jun 15, 2026')).not.toBeNull();
});

test('keeps leaderboard chrome visible while showing inline loading state', async () => {
  render(
    <AuthProvider>
      <LeaderboardScreen onBack={() => {}} />
    </AuthProvider>,
  );

  expect(screen.getByRole('heading', { name: 'Leaderboard' })).not.toBeNull();
  expect(screen.getByText('Today')).not.toBeNull();
  expect(screen.getByText('Jun 16, 2026')).not.toBeNull();
  expect(screen.getByRole('status', { name: 'Loading leaderboard' })).toBeTruthy();
  await screen.findByText('Mike');
  expect(screen.queryByRole('status', { name: 'Loading leaderboard' })).toBeNull();
});

test('shows the leaderboard freshness and tiebreak disclaimer', async () => {
  render(
    <AuthProvider>
      <LeaderboardScreen onBack={() => {}} />
    </AuthProvider>,
  );

  expect(await screen.findByText('Updates every 2 min. Ties: fastest run, then earliest submission.')).not.toBeNull();
});


test('omits the special label on non-special days', async () => {
  render(
    <AuthProvider>
      <LeaderboardScreen onBack={() => {}} />
    </AuthProvider>,
  );

  await screen.findByRole('heading', { name: 'Leaderboard' });
  expect(screen.queryByText(`${MESSI_SPECIAL.label} ${MESSI_SPECIAL.flag}`)).toBeNull();
});

test('inserts a Messi Special slot after its date and fetches its own game mode', async () => {
  getDateOverrideMock.mockReturnValue('2026-07-15');

  render(
    <AuthProvider>
      <LeaderboardScreen onBack={() => {}} />
    </AuthProvider>,
  );

  await screen.findByRole('heading', { name: 'Leaderboard' });
  await waitFor(() => expect(fetchLeaderboardMock).toHaveBeenCalledWith(0, undefined, undefined));

  // One step back from the regular Jul 15 board sits the special board.
  fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));

  expect(await screen.findByText(`${MESSI_SPECIAL.label} ${MESSI_SPECIAL.flag}`)).not.toBeNull();
  expect(screen.getByText('Jul 15, 2026')).not.toBeNull();
  await waitFor(() =>
    expect(fetchLeaderboardMock).toHaveBeenLastCalledWith(0, undefined, MESSI_SPECIAL.gameMode),
  );

  // Stepping forward returns to the regular board.
  fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
  await waitFor(() => expect(fetchLeaderboardMock).toHaveBeenLastCalledWith(0, undefined, undefined));
});

test('opens directly on the special board when viewing from special mode', async () => {
  getDateOverrideMock.mockReturnValue('2026-07-15');
  window.history.replaceState({}, '', '/?special=messi');

  try {
    render(
      <AuthProvider>
        <LeaderboardScreen onBack={() => {}} />
      </AuthProvider>,
    );

    expect(await screen.findByText(`${MESSI_SPECIAL.label} ${MESSI_SPECIAL.flag}`)).not.toBeNull();
    await waitFor(() =>
      expect(fetchLeaderboardMock).toHaveBeenCalledWith(0, undefined, MESSI_SPECIAL.gameMode),
    );
  } finally {
    window.history.replaceState({}, '', '/');
  }
});

test('extended special window pins one board slot per live day', async () => {
  getDateOverrideMock.mockReturnValue('2026-07-16');
  const twoDay = { ...MESSI_SPECIAL, endDate: '2026-07-16' };
  const original = SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, twoDay);

  try {
    render(
      <AuthProvider>
        <LeaderboardScreen onBack={() => {}} />
      </AuthProvider>,
    );
    await screen.findByRole('heading', { name: 'Leaderboard' });

    // Today (Jul 16 regular) → Messi Jul 16 → Jul 15 regular → Messi Jul 15
    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(await screen.findByText(`${MESSI_SPECIAL.label} ${MESSI_SPECIAL.flag}`)).not.toBeNull();
    expect(screen.getByText('Jul 16, 2026')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    await waitFor(() => expect(screen.queryByText(`${MESSI_SPECIAL.label} ${MESSI_SPECIAL.flag}`)).toBeNull());
    expect(screen.getByText('Jul 15, 2026')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(await screen.findByText(`${MESSI_SPECIAL.label} ${MESSI_SPECIAL.flag}`)).not.toBeNull();
    expect(screen.getByText('Jul 15, 2026')).not.toBeNull();
    await waitFor(() =>
      expect(fetchLeaderboardMock).toHaveBeenLastCalledWith(1, undefined, MESSI_SPECIAL.gameMode),
    );
  } finally {
    SPECIAL_DAYS.splice(0, SPECIAL_DAYS.length, ...original);
  }
});
