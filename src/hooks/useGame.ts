import { useState, useCallback, useMemo } from 'react';
import type { GameState, RoundResult, Puzzle } from '../types';
import { calculateScore, getResultColor } from '../engine/scoring';
import { saveGameState, loadGameState, updateStatsAfterGame } from '../engine/storage';
import { getAccessToken } from '../lib/auth';
import { submitScore, savePendingScore, isScoreSubmitted, markScoreSubmitted, markScoreSuperseded, GAME_MODE, GAME_TYPE } from '../lib/api';

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

        if (!isScoreSubmitted(puzzle.id)) {
          const payload = {
            game_type: GAME_TYPE,
            game_mode: GAME_MODE,
            scores: newState.totalScore,
            metadata: {
              total_time: Math.round((newState.elapsedMs ?? 0) / 1000),
              puzzle_number: puzzle.number,
              sport: puzzle.sport,
              rounds: newState.results.map((round) => ({
                event_text: round.event.text,
                guessed_year: round.guessedYear,
                actual_year: round.actualYear,
                diff: round.diff,
                score: round.score,
                tier: getResultColor(round.diff),
              })),
            },
          };

          if (getAccessToken()) {
            void submitScore(payload)
              .then((submitResult) => {
                markScoreSubmitted(puzzle.id);
                if (submitResult === 'duplicate') markScoreSuperseded(puzzle.id);
              })
              .catch(() => savePendingScore(payload, puzzle.id));
          } else {
            savePendingScore(payload, puzzle.id);
          }
        }
      }

      return result;
    },
    [state, currentEvent, puzzle.id, puzzle.number, puzzle.sport]
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
