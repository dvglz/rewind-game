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
  test('maps top_20 and me from the backend response (dayOffset=0)', async () => {
    vi.stubEnv('VITE_MOCK_API', 'false');
    vi.stubEnv('VITE_BASE_URL', 'https://test.4taps.me');
    vi.resetModules();
    document.cookie = 'cp_access_token=tok123';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        leaderboard: { id: 11, start_date: '2026-06-12', end_date: '2026-06-12', previous_leaderboard_id: 10 },
        top_20: [
          { place_scores: 1, username: 'Mike', scores: 950, time: 80000 },
          { place_scores: 2, username: 'Sarah', scores: 870, time: 91000 },
        ],
        me: { place_scores: 21, username: 'You', scores: 777, time: 83000 },
      }),
    });

    const { fetchLeaderboard: fetchRealLeaderboard } = await import('./leaderboard');
    const board = await fetchRealLeaderboard(0);

    expect(board.date).toBe('2026-06-12');
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

  test('uses previous_leaderboard_id chain for dayOffset>0', async () => {
    vi.stubEnv('VITE_MOCK_API', 'false');
    vi.stubEnv('VITE_BASE_URL', 'https://test.4taps.me');
    vi.resetModules();
    document.cookie = 'cp_access_token=tok123';

    // First call: fetch today (dayOffset=0 to prime the cache)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        leaderboard: { id: 11, start_date: '2026-06-12', end_date: '2026-06-12', previous_leaderboard_id: 10 },
        top_20: [{ place_scores: 1, username: 'Today', scores: 950 }],
        me: null,
      }),
    });

    const { fetchLeaderboard: fetchRealLeaderboard } = await import('./leaderboard');
    await fetchRealLeaderboard(0);

    // Second call: fetch yesterday (dayOffset=1) → should hit /leaderboard/10/
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        leaderboard: { id: 10, start_date: '2026-06-11', end_date: '2026-06-11', previous_leaderboard_id: 9 },
        top_20: [{ place_scores: 1, username: 'Yesterday', scores: 800 }],
        me: null,
      }),
    });

    const board = await fetchRealLeaderboard(1);

    expect(board.date).toBe('2026-06-11');
    expect(board.entries[0].displayName).toBe('Yesterday');
    // Verify it called the /leaderboard/10/ endpoint
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/playhub/leaderboard/10/'),
      expect.any(Object),
    );
  });

  test('returns empty board when no previous leaderboard exists', async () => {
    vi.stubEnv('VITE_MOCK_API', 'false');
    vi.stubEnv('VITE_BASE_URL', 'https://test.4taps.me');
    vi.resetModules();
    document.cookie = 'cp_access_token=tok123';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        leaderboard: { id: 11, start_date: '2026-06-12', end_date: '2026-06-12', previous_leaderboard_id: null },
        top_20: [{ place_scores: 1, username: 'Only', scores: 500 }],
        me: null,
      }),
    });

    const { fetchLeaderboard: fetchRealLeaderboard } = await import('./leaderboard');
    await fetchRealLeaderboard(0);

    const board = await fetchRealLeaderboard(1);
    expect(board.entries).toHaveLength(0);
    expect(board.currentUser).toBeNull();
  });
});
