import { useState, useCallback, useMemo } from 'react';
import type { GameState, RoundResult, Puzzle } from '../types';
import { calculateScore } from '../engine/scoring';
import { saveGameState, loadGameState, updateStatsAfterGame } from '../engine/storage';

const TOTAL_ROUNDS = 5;

export function useGame(puzzle: Puzzle) {
  const [state, setState] = useState<GameState>(() => {
    const saved = loadGameState(puzzle.id);
    if (saved) return saved;
    return {
      puzzleId: puzzle.id,
      currentRound: 0,
      results: [],
      totalScore: 0,
      completed: false,
      startedAt: Date.now(),
    };
  });

  const currentEvent = useMemo(
    () => puzzle.events[state.currentRound] ?? null,
    [puzzle.events, state.currentRound]
  );

  const submitGuess = useCallback(
    (guessedYear: number) => {
      if (state.completed || !currentEvent) return null;

      const diff = guessedYear - currentEvent.year;
      const score = calculateScore(diff, state.currentRound);

      const result: RoundResult = {
        event: currentEvent,
        guessedYear,
        actualYear: currentEvent.year,
        diff,
        score,
      };

      const nextRound = state.currentRound + 1;
      const completed = nextRound >= TOTAL_ROUNDS;
      const startedAt = state.startedAt ?? Date.now();
      const elapsedMs = completed ? Math.max(0, Date.now() - startedAt) : state.elapsedMs;

      const newState: GameState = {
        ...state,
        currentRound: nextRound,
        results: [...state.results, result],
        totalScore: state.totalScore + score,
        completed,
        startedAt,
        elapsedMs,
      };

      setState(newState);
      saveGameState(newState);

      if (completed) {
        updateStatsAfterGame(puzzle.id);
      }

      return result;
    },
    [state, currentEvent, puzzle.id]
  );

  return {
    state,
    currentEvent,
    currentRound: state.currentRound,
    totalRounds: TOTAL_ROUNDS,
    isComplete: state.completed,
    results: state.results,
    totalScore: state.totalScore,
    submitGuess,
  };
}
