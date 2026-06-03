import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { useGame } from './useGame';
import type { Puzzle } from '../types';

vi.mock('../engine/storage', () => ({
  saveGameState: vi.fn(),
  loadGameState: vi.fn(() => null),
  updateStatsAfterGame: vi.fn(),
}));

const puzzle: Puzzle = {
  id: 'rewind-001',
  number: 1,
  sport: 'nba',
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
