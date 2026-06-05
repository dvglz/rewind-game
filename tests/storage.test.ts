import { describe, it, expect, beforeEach } from 'vitest';
import { saveGameState, loadGameState, saveStats, loadStats } from '../src/engine/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('game state persistence', () => {
  it('returns null when no state saved', () => {
    expect(loadGameState('2026-06-03')).toBeNull();
  });

  it('saves and loads game state', () => {
    const state = {
      puzzleId: '2026-06-03',
      currentRound: 2,
      results: [],
      totalScore: 1500,
      completed: false,
    };
    saveGameState(state);
    expect(loadGameState('2026-06-03')).toEqual(state);
  });
});

describe('resume detection', () => {
  it('detects in-progress game', () => {
    const state = {
      puzzleId: '2026-06-03-american',
      currentRound: 2,
      results: [],
      totalScore: 1500,
      completed: false,
    };
    saveGameState(state);
    const loaded = loadGameState('2026-06-03-american');
    expect(loaded).not.toBeNull();
    expect(loaded!.completed).toBe(false);
    expect(loaded!.currentRound).toBe(2);
  });

  it('detects completed game', () => {
    const state = {
      puzzleId: '2026-06-03-american',
      currentRound: 5,
      results: [],
      totalScore: 5000,
      completed: true,
    };
    saveGameState(state);
    const loaded = loadGameState('2026-06-03-american');
    expect(loaded).not.toBeNull();
    expect(loaded!.completed).toBe(true);
  });

  it('returns null for no saved game', () => {
    const loaded = loadGameState('nonexistent-puzzle');
    expect(loaded).toBeNull();
  });
});

describe('player stats', () => {
  it('returns default stats when none saved', () => {
    const stats = loadStats();
    expect(stats.currentStreak).toBe(0);
    expect(stats.gamesPlayed).toBe(0);
  });

  it('saves and loads stats', () => {
    const stats = { currentStreak: 3, maxStreak: 5, gamesPlayed: 10, lastPlayedDate: '2026-06-03' };
    saveStats(stats);
    expect(loadStats()).toEqual(stats);
  });
});
