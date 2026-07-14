import { useState, useCallback, useMemo } from 'react';
import type { GameState, RoundResult, Puzzle } from '../types';
import { calculateScore, getResultColor } from '../engine/scoring';
import { saveGameState, loadGameState, updateStatsAfterGame } from '../engine/storage';
import { getAccessToken } from '../lib/auth';
import { submitScore, savePendingScore, isScoreSubmitted, markScoreSubmitted, markScoreSuperseded, isRewardClaimed, markRewardClaimed, GAME_MODE, GAME_TYPE } from '../lib/api';
import { claimReward } from '../lib/playhub';
import { evaluateMissions } from '../lib/missions';

interface UseGameOptions {
  scoringEnabled?: boolean;
}

export function useGame(puzzle: Puzzle, { scoringEnabled = true }: UseGameOptions = {}) {
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

  const totalRounds = puzzle.events.length;

  const submitGuess = useCallback(
    (guessedYear: number) => {
      if (state.completed || !currentEvent) return null;

      const diff = guessedYear - currentEvent.year;
      const score = calculateScore(diff, state.currentRound, puzzle.weights);

      const result: RoundResult = {
        event: currentEvent,
        guessedYear,
        actualYear: currentEvent.year,
        diff,
        score,
      };

      const nextRound = state.currentRound + 1;
      const completed = nextRound >= totalRounds;
      const startedAt = state.startedAt ?? Date.now();
      const elapsedMs = completed
        ? Math.max(0, Date.now() - startedAt - (state.pausedMs ?? 0))
        : state.elapsedMs;

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

      if (completed && scoringEnabled) {
        updateStatsAfterGame(puzzle.id);

        if (!isScoreSubmitted(puzzle.id)) {
          const payload = {
            game_type: GAME_TYPE,
            // Specials submit to their own PlayHub mode (separate leaderboard chain).
            game_mode: puzzle.special?.gameMode ?? GAME_MODE,
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

        for (const rewardKey of evaluateMissions(newState.totalScore, newState.results)) {
          if (isRewardClaimed(rewardKey, puzzle.id)) continue;
          void claimReward(rewardKey).then((ok) => {
            if (ok) markRewardClaimed(rewardKey, puzzle.id);
          });
        }
      }

      return result;
    },
    [state, currentEvent, puzzle.id, puzzle.number, puzzle.sport, puzzle.weights, puzzle.special, totalRounds, scoringEnabled]
  );

  const recordPause = useCallback((ms: number) => {
    if (ms <= 0) return;
    setState((prev) => {
      if (prev.completed) return prev; // final elapsedMs is already frozen
      const next = { ...prev, pausedMs: (prev.pausedMs ?? 0) + ms };
      saveGameState(next);
      return next;
    });
  }, []);

  return {
    state,
    currentEvent,
    currentRound: state.currentRound,
    totalRounds,
    isComplete: state.completed,
    results: state.results,
    totalScore: state.totalScore,
    submitGuess,
    recordPause,
  };
}
