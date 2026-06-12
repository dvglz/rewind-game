import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { useGame } from './useGame';
import type { Puzzle } from '../types';

vi.mock('../engine/storage', () => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(() => null),
  updateStatsAfterGame: vi.fn(),
}));

const { saveGameState } = await import('../engine/storage');

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
