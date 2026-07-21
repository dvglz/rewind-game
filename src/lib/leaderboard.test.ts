import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
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

  test('flags the in-page row as the current user when user_id matches me', async () => {
    vi.stubEnv('VITE_MOCK_API', 'false');
    vi.stubEnv('VITE_BASE_URL', 'https://test.4taps.me');
    vi.resetModules();
    document.cookie = 'cp_access_token=tok123';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        leaderboard: { id: 11, start_date: '2026-06-12', end_date: '2026-06-12', previous_leaderboard_id: 10 },
        top_20: [
          { place_scores: 1, username: 'Mike', scores: 950, user_id: 111 },
          { place_scores: 2, username: 'Allies', scores: 870, user_id: 222 },
        ],
        me: { place_scores: 2, username: 'Allies', scores: 870, user_id: 222 },
      }),
    });

    const { fetchLeaderboard: fetchRealLeaderboard } = await import('./leaderboard');
    const board = await fetchRealLeaderboard(0);

    expect(board.entries[0].isCurrentUser).toBe(false);
    expect(board.entries[1]).toMatchObject({ displayName: 'Allies', isCurrentUser: true });
  });

  test('maps the top-level total_time (seconds) to timeMs', async () => {
    vi.stubEnv('VITE_MOCK_API', 'false');
    vi.stubEnv('VITE_BASE_URL', 'https://test.4taps.me');
    vi.resetModules();
    document.cookie = 'cp_access_token=tok123';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        leaderboard: { id: 11, start_date: '2026-06-12', end_date: '2026-06-12', previous_leaderboard_id: 10 },
        top_20: [{ place_scores: 1, username: 'Mike', scores: 950, total_time: 35 }],
        me: null,
      }),
    });

    const { fetchLeaderboard: fetchRealLeaderboard } = await import('./leaderboard');
    const board = await fetchRealLeaderboard(0);

    expect(board.entries[0].timeMs).toBe(35000);
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

describe('fetchLeaderboard period', () => {
  const okResponse = (id: number, startDate = '2026-07-14', endDate = '2026-07-20') => ({
    ok: true,
    json: async () => ({
      leaderboard: { id, start_date: startDate, end_date: endDate, previous_leaderboard_id: id - 1 },
      top_20: [{ user_id: 1, username: 'A', scores: 900, place_scores: 1, total_time: 60 }],
      me: null,
    }),
  });

  beforeEach(() => {
    vi.stubEnv('VITE_MOCK_API', 'false');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(10)));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('requests the weekly period at offset 0', async () => {
    await fetchLeaderboard(0, { period: 'weekly' });
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/playhub/leaderboard/weekly/scores/');
  });

  it('requests the monthly period at offset 0', async () => {
    await fetchLeaderboard(0, { period: 'monthly' });
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/playhub/leaderboard/monthly/scores/');
  });

  it('maps start/end dates onto the board', async () => {
    const board = await fetchLeaderboard(0, { period: 'weekly' });
    expect(board.startDate).toBe('2026-07-14');
    expect(board.endDate).toBe('2026-07-20');
  });

  it('keys the id cache per period so daily and weekly do not collide', async () => {
    // Prime daily then weekly at offset 1; both must hit the network for their
    // own period rather than reusing a cross-period cached id.
    await fetchLeaderboard(0, { period: 'daily' });
    await fetchLeaderboard(0, { period: 'weekly' });
    const urls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes('/daily/scores/'))).toBe(true);
    expect(urls.some((u) => u.includes('/weekly/scores/'))).toBe(true);
  });
});
