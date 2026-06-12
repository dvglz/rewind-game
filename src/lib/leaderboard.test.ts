import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchLeaderboard } from './leaderboard';
import { LEADERBOARD_PAGE_LIMIT } from '../config/leaderboard';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_MOCK_API', 'true');
});

describe('fetchLeaderboard (mock)', () => {
  test('returns at most LEADERBOARD_PAGE_LIMIT entries', async () => {
    const board = await fetchLeaderboard(0);
    expect(board.entries.length).toBeLessThanOrEqual(LEADERBOARD_PAGE_LIMIT);
    expect(board.entries.length).toBeGreaterThan(0);
  });

  test('entries are ranked 1..N in descending score order', async () => {
    const board = await fetchLeaderboard(0);
    board.entries.forEach((entry, i) => {
      expect(entry.rank).toBe(i + 1);
      if (i > 0) {
        expect(entry.score).toBeLessThanOrEqual(board.entries[i - 1].score);
      }
    });
  });

  test('no score exceeds the 1000 daily cap', async () => {
    const board = await fetchLeaderboard(0);
    board.entries.forEach((e) => expect(e.score).toBeLessThanOrEqual(1000));
  });

  test('is deterministic for the same dayOffset', async () => {
    const a = await fetchLeaderboard(2);
    const b = await fetchLeaderboard(2);
    expect(b).toEqual(a);
  });

  test('differs across days', async () => {
    const today = await fetchLeaderboard(0);
    const yesterday = await fetchLeaderboard(1);
    expect(yesterday.date).not.toBe(today.date);
  });

  test('mocks the current user outside the top page so the pin is exercised', async () => {
    const board = await fetchLeaderboard(0);
    expect(board.currentUser).not.toBeNull();
    expect(board.currentUser!.rank).toBeGreaterThan(LEADERBOARD_PAGE_LIMIT);
    expect(board.currentUser!.isCurrentUser).toBe(true);
  });
});

describe('fetchLeaderboard (real response mapping)', () => {
  test('maps top_20 and me from the backend response', async () => {
    vi.stubEnv('VITE_MOCK_API', 'false');
    vi.stubEnv('VITE_BASE_URL', 'https://test.4taps.me');
    vi.resetModules();
    document.cookie = 'cp_access_token=tok123';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        leaderboard: { id: 11, start_date: '2026-06-12', end_date: '2026-06-12' },
        top_20: [
          { rank: 1, username: 'Mike', score: 950, time: 80000 },
          { rank: 2, username: 'Sarah', score: 870, time: 91000 },
        ],
        me: { rank: 21, username: 'You', score: 777, time: 83000 },
      }),
    });

    const { fetchLeaderboard: fetchRealLeaderboard } = await import('./leaderboard');
    const board = await fetchRealLeaderboard(0);

    expect(board.entries).toHaveLength(2);
    expect(board.entries[0]).toMatchObject({
      rank: 1,
      displayName: 'Mike',
      score: 950,
      timeMs: 80000,
      isCurrentUser: false,
    });
    expect(board.currentUser).toMatchObject({
      rank: 21,
      displayName: 'You',
      score: 777,
      timeMs: 83000,
      isCurrentUser: true,
    });
  });
});
