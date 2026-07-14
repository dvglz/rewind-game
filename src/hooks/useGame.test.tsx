import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useGame } from './useGame';
import type { Puzzle } from '../types';

vi.mock('../lib/auth', () => ({
  getAccessToken: vi.fn(() => null),
}));

vi.mock('../lib/api', () => ({
  submitScore: vi.fn(() => Promise.resolve('submitted')),
  savePendingScore: vi.fn(),
  isScoreSubmitted: vi.fn(() => false),
  markScoreSubmitted: vi.fn(),
  markScoreSuperseded: vi.fn(),
  isRewardClaimed: vi.fn(() => false),
  markRewardClaimed: vi.fn(),
  GAME_TYPE: 'rewind',
  GAME_MODE: 'rewind_nba',
}));

vi.mock('../lib/playhub', () => ({
  claimReward: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../engine/storage', () => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(() => null),
  updateStatsAfterGame: vi.fn(),
}));

const { saveGameState, updateStatsAfterGame } = await import('../engine/storage');
const { getAccessToken } = await import('../lib/auth');
const { savePendingScore, submitScore, markScoreSubmitted, markScoreSuperseded, markRewardClaimed } = await import('../lib/api');
const { claimReward } = await import('../lib/playhub');

const puzzle: Puzzle = {
  id: 'rewind-001',
  number: 1,
  sport: 'american',
  theme: 'NBA Finals',
  events: [
    { text: 'Q1', year: 2001 },
    { text: 'Q2', year: 2002 },
    { text: 'Q3', year: 2003 },
    { text: 'Q4', year: 2004 },
    { text: 'Q5', year: 2005 },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

test('scores rounds with escalating weights that sum to 1000 per day', () => {
  const { result } = renderHook(() => useGame(puzzle));

  act(() => {
    const first = result.current.submitGuess(2001);
    expect(first?.score).toBe(100);
  });

  act(() => {
    const second = result.current.submitGuess(2002);
    expect(second?.score).toBe(100);
  });

  act(() => {
    const third = result.current.submitGuess(2003);
    expect(third?.score).toBe(200);
  });

  act(() => {
    const fourth = result.current.submitGuess(2004);
    expect(fourth?.score).toBe(300);
  });

  act(() => {
    const fifth = result.current.submitGuess(2005);
    expect(fifth?.score).toBe(300);
  });

  expect(result.current.totalScore).toBe(1000);
});

test('drops points sharply even when the guess is only one year off', () => {
  const { result } = renderHook(() => useGame(puzzle));

  let firstRoundScore = 0;

  act(() => {
    const round = result.current.submitGuess(2002);
    firstRoundScore = round?.score ?? 0;
  });

  expect(firstRoundScore).toBe(82);
});

test('stamps startedAt when creating a fresh game state', () => {
  vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

  const { result } = renderHook(() => useGame(puzzle));

  expect(result.current.state.startedAt).toBe(1_700_000_000_000);
});

test('persists elapsedMs when the final guess completes the game', () => {
  vi.spyOn(Date, 'now')
    .mockReturnValueOnce(1_700_000_000_000)
    .mockReturnValue(1_700_000_125_000);

  const { result } = renderHook(() => useGame(puzzle));

  act(() => {
    result.current.submitGuess(2001);
  });
  act(() => {
    result.current.submitGuess(2002);
  });
  act(() => {
    result.current.submitGuess(2003);
  });
  act(() => {
    result.current.submitGuess(2004);
  });
  act(() => {
    result.current.submitGuess(2005);
  });

  expect(vi.mocked(saveGameState).mock.calls.at(-1)?.[0]).toMatchObject({
    completed: true,
    startedAt: 1_700_000_000_000,
    elapsedMs: 125000,
  });
});

test('stashes a pending score when an anonymous player completes the game', () => {
  vi.spyOn(Date, 'now')
    .mockReturnValueOnce(1_700_000_000_000)
    .mockReturnValue(1_700_000_125_000);
  vi.mocked(getAccessToken).mockReturnValue(null);

  const { result } = renderHook(() => useGame(puzzle));

  act(() => {
    result.current.submitGuess(2001);
  });
  act(() => {
    result.current.submitGuess(2002);
  });
  act(() => {
    result.current.submitGuess(2003);
  });
  act(() => {
    result.current.submitGuess(2004);
  });
  act(() => {
    result.current.submitGuess(2005);
  });

  expect(savePendingScore).toHaveBeenCalledTimes(1);
  expect(submitScore).not.toHaveBeenCalled();
});

test('does not update stats or sync score when scoring is disabled', () => {
  vi.spyOn(Date, 'now')
    .mockReturnValueOnce(1_700_000_000_000)
    .mockReturnValue(1_700_000_125_000);
  vi.mocked(getAccessToken).mockReturnValue('tok123');

  const { result } = renderHook(() => useGame(puzzle, { scoringEnabled: false }));

  act(() => { result.current.submitGuess(2001); });
  act(() => { result.current.submitGuess(2002); });
  act(() => { result.current.submitGuess(2003); });
  act(() => { result.current.submitGuess(2004); });
  act(() => { result.current.submitGuess(2005); });

  expect(result.current.isComplete).toBe(true);
  expect(updateStatsAfterGame).not.toHaveBeenCalled();
  expect(submitScore).not.toHaveBeenCalled();
  expect(savePendingScore).not.toHaveBeenCalled();
});

test('submits a completed score immediately for authenticated players', async () => {
  vi.spyOn(Date, 'now')
    .mockReturnValueOnce(1_700_000_000_000)
    .mockReturnValue(1_700_000_125_000);
  vi.mocked(getAccessToken).mockReturnValue('tok123');

  const { result } = renderHook(() => useGame(puzzle));

  await act(async () => {
    result.current.submitGuess(2001);
  });
  await act(async () => {
    result.current.submitGuess(2002);
  });
  await act(async () => {
    result.current.submitGuess(2003);
  });
  await act(async () => {
    result.current.submitGuess(2004);
  });
  await act(async () => {
    result.current.submitGuess(2005);
    await Promise.resolve();
  });

  expect(submitScore).toHaveBeenCalledTimes(1);
  expect(markScoreSubmitted).toHaveBeenCalledWith('rewind-001');
});

test('marks the score superseded (not pending) when the backend reports a duplicate', async () => {
  vi.spyOn(Date, 'now')
    .mockReturnValueOnce(1_700_000_000_000)
    .mockReturnValue(1_700_000_125_000);
  vi.mocked(getAccessToken).mockReturnValue('tok123');
  vi.mocked(submitScore).mockResolvedValueOnce('duplicate');

  const { result } = renderHook(() => useGame(puzzle));

  await act(async () => { result.current.submitGuess(2001); });
  await act(async () => { result.current.submitGuess(2002); });
  await act(async () => { result.current.submitGuess(2003); });
  await act(async () => { result.current.submitGuess(2004); });
  await act(async () => {
    result.current.submitGuess(2005);
    await Promise.resolve();
  });

  expect(submitScore).toHaveBeenCalledTimes(1);
  expect(markScoreSubmitted).toHaveBeenCalledWith('rewind-001');
  expect(markScoreSuperseded).toHaveBeenCalledWith('rewind-001');
  expect(savePendingScore).not.toHaveBeenCalled();
});

test('claims earned missions once on daily completion when authenticated', async () => {
  vi.spyOn(Date, 'now')
    .mockReturnValueOnce(1_700_000_000_000)
    .mockReturnValue(1_700_000_125_000);
  vi.mocked(getAccessToken).mockReturnValue('tok123');

  const { result } = renderHook(() => useGame(puzzle));

  // Perfect run: guess each event's exact year → 1000 points, all 5 green.
  await act(async () => { result.current.submitGuess(2001); });
  await act(async () => { result.current.submitGuess(2002); });
  await act(async () => { result.current.submitGuess(2003); });
  await act(async () => { result.current.submitGuess(2004); });
  await act(async () => {
    result.current.submitGuess(2005);
    await Promise.resolve();
  });

  expect(claimReward).toHaveBeenCalledWith('participant');
  expect(claimReward).toHaveBeenCalledWith('mission_2');
  expect(claimReward).toHaveBeenCalledWith('mission_3');
  expect(claimReward).toHaveBeenCalledTimes(3);
  // Marked claimed only after the (resolved) 2xx response.
  expect(markRewardClaimed).toHaveBeenCalledWith('participant', 'rewind-001');
});

test('does not claim missions when scoring is disabled', () => {
  vi.mocked(getAccessToken).mockReturnValue('tok123');

  const { result } = renderHook(() => useGame(puzzle, { scoringEnabled: false }));

  act(() => { result.current.submitGuess(2001); });
  act(() => { result.current.submitGuess(2002); });
  act(() => { result.current.submitGuess(2003); });
  act(() => { result.current.submitGuess(2004); });
  act(() => { result.current.submitGuess(2005); });

  expect(claimReward).not.toHaveBeenCalled();
});

const tenRoundPuzzle: Puzzle = {
  id: 'test-special',
  number: 28,
  sport: 'american',
  weights: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
  events: Array.from({ length: 10 }, (_, i) => ({
    text: `Event ${i + 1}`,
    year: 2000 + i,
    detail: `In ${2000 + i}, something happened.`,
  })),
};

describe('useGame with a 10-round weighted puzzle', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  test('totalRounds follows the event count and completion needs 10 guesses', () => {
    const { result } = renderHook(() => useGame(tenRoundPuzzle, { scoringEnabled: false }));
    expect(result.current.totalRounds).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(result.current.isComplete).toBe(false);
      act(() => { result.current.submitGuess(2000 + i); }); // all perfect
    }
    expect(result.current.isComplete).toBe(true);
    expect(result.current.totalScore).toBe(1000); // flat weights, 10 perfects
  });

  test('recordPause accumulates and final elapsedMs excludes paused time', () => {
    const { result } = renderHook(() => useGame(tenRoundPuzzle, { scoringEnabled: false }));
    for (let i = 0; i < 9; i++) {
      act(() => { result.current.submitGuess(2000 + i); });
      act(() => { result.current.recordPause(2_000); });
    }
    act(() => { vi.advanceTimersByTime(60_000); });
    act(() => { result.current.submitGuess(2009); });
    // 60s wall clock minus 9 × 2s of pauses = 42s
    expect(result.current.state.elapsedMs).toBe(42_000);
    expect(result.current.state.pausedMs).toBe(18_000);
  });

  test('recordPause after completion is a no-op', () => {
    const { result } = renderHook(() => useGame(tenRoundPuzzle, { scoringEnabled: false }));
    for (let i = 0; i < 10; i++) act(() => { result.current.submitGuess(2000 + i); });
    const before = result.current.state.elapsedMs;
    act(() => { result.current.recordPause(5_000); });
    expect(result.current.state.pausedMs ?? 0).toBe(0);
    expect(result.current.state.elapsedMs).toBe(before);
  });
});
