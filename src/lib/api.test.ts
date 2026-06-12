import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
vi.stubEnv('VITE_BASE_URL', 'https://test.4taps.me');
vi.stubEnv('VITE_MOCK_API', 'false');

beforeEach(() => {
  vi.resetModules();
  mockFetch.mockReset();
  document.cookie = 'cp_access_token=; path=/; max-age=0';
  localStorage.clear();
});

describe('submitScore', () => {
  it('POSTs score payload with auth header', async () => {
    document.cookie = 'cp_access_token=tok123';
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { submitScore } = await import('./api');

    await submitScore({
      game_type: 'REWIND',
      game_mode: 'rewind_nba',
      scores: 750,
      metadata: {
        total_time: 120,
        puzzle_number: 3,
        sport: 'american',
        rounds: [{
          event_text: 'Test event',
          guessed_year: 2005,
          actual_year: 2003,
          diff: 2,
          score: 164,
          tier: 'great',
        }],
      },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.4taps.me/playhub/scores/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Token tok123',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('throws on non-OK response', async () => {
    document.cookie = 'cp_access_token=tok123';
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ detail: 'bad' }) });

    const { submitScore } = await import('./api');

    await expect(submitScore({
      game_type: 'REWIND',
      game_mode: 'rewind_nba',
      scores: 0,
      metadata: { total_time: 0, puzzle_number: 1, sport: 'american', rounds: [] },
    })).rejects.toThrow('bad');
  });
});

describe('fetchMyScore', () => {
  it('fetches the first matching score for a given date with auth', async () => {
    document.cookie = 'cp_access_token=tok123';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([{
        scores: 820,
        metadata: { total_time: 95, puzzle_number: 1, sport: 'american', rounds: [] },
        created: '2026-06-12T12:00:00Z',
      }]),
    });

    const { fetchMyScore } = await import('./api');
    const result = await fetchMyScore('2026-06-12');

    expect(result?.scores).toBe(820);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/playhub/scores/?game_type=REWIND&game_mode=rewind_nba&date=2026-06-12'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Token tok123' }),
      }),
    );
  });

  it('returns null on 404', async () => {
    document.cookie = 'cp_access_token=tok123';
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });

    const { fetchMyScore } = await import('./api');
    const result = await fetchMyScore('2026-06-12');

    expect(result).toBeNull();
  });

  it('returns null when not authenticated', async () => {
    const { fetchMyScore } = await import('./api');
    const result = await fetchMyScore('2026-06-12');

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('fetchLeaderboardApi', () => {
  it('fetches global leaderboard for a date', async () => {
    document.cookie = 'cp_access_token=tok123';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ top_20: [{ rank: 1, username: 'Mike', score: 950, time: 80000 }], me: null }),
    });

    const { fetchLeaderboardApi } = await import('./api');
    await fetchLeaderboardApi('2026-06-12');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/playhub/leaderboard/daily/scores/?game_type=REWIND&game_mode=rewind_nba&date=2026-06-12'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Token tok123' }),
      }),
    );
  });

  it('passes group_id when provided', async () => {
    document.cookie = 'cp_access_token=tok123';
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ top_20: [], me: null }) });

    const { fetchLeaderboardApi } = await import('./api');
    await fetchLeaderboardApi('2026-06-12', 42);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('group_id=42'),
      expect.any(Object),
    );
  });
});

describe('flushPendingScore', () => {
  it('POSTs pending score and clears storage on success', async () => {
    document.cookie = 'cp_access_token=tok123';
    const { flushPendingScore, PENDING_SCORE_KEY } = await import('./api');
    localStorage.setItem(PENDING_SCORE_KEY, JSON.stringify({
      game_type: 'rewind',
      game_type: 'REWIND',
      game_mode: 'rewind_nba',
      scores: 500,
      metadata: { total_time: 60, puzzle_number: 1, sport: 'american', rounds: [] },
    }));

    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    await flushPendingScore();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(PENDING_SCORE_KEY)).toBeNull();
  });

  it('does nothing when no pending score exists', async () => {
    document.cookie = 'cp_access_token=tok123';
    const { flushPendingScore } = await import('./api');

    await flushPendingScore();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('keeps pending score on unauthorized response', async () => {
    document.cookie = 'cp_access_token=tok123';
    const { flushPendingScore, PENDING_SCORE_KEY } = await import('./api');
    localStorage.setItem(PENDING_SCORE_KEY, JSON.stringify({
      game_type: 'rewind',
      game_type: 'REWIND',
      game_mode: 'rewind_nba',
      scores: 100,
      metadata: { total_time: 30, puzzle_number: 1, sport: 'american', rounds: [] },
    }));

    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ detail: 'auth expired' }) });

    await flushPendingScore();

    expect(localStorage.getItem(PENDING_SCORE_KEY)).not.toBeNull();
  });

  it('clears pending score on duplicate submission response', async () => {
    document.cookie = 'cp_access_token=tok123';
    const { flushPendingScore, PENDING_SCORE_KEY } = await import('./api');
    localStorage.setItem(PENDING_SCORE_KEY, JSON.stringify({
      game_type: 'rewind',
      game_type: 'REWIND',
      game_mode: 'rewind_nba',
      scores: 100,
      metadata: { total_time: 30, puzzle_number: 1, sport: 'american', rounds: [] },
    }));

    mockFetch.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ detail: 'already submitted' }) });

    await flushPendingScore();

    expect(localStorage.getItem(PENDING_SCORE_KEY)).toBeNull();
  });

  it('keeps pending score on 500 for future retry', async () => {
    document.cookie = 'cp_access_token=tok123';
    const { flushPendingScore, PENDING_SCORE_KEY } = await import('./api');
    localStorage.setItem(PENDING_SCORE_KEY, JSON.stringify({
      game_type: 'rewind',
      game_type: 'REWIND',
      game_mode: 'rewind_nba',
      scores: 100,
      metadata: { total_time: 30, puzzle_number: 1, sport: 'american', rounds: [] },
    }));

    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });

    await flushPendingScore();

    expect(localStorage.getItem(PENDING_SCORE_KEY)).not.toBeNull();
  });
});
