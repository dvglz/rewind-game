import type { GameState, PlayerStats } from '../types';

const GAME_STATE_KEY = 'rewind_game';
const STATS_KEY = 'rewind_stats';
const RULES_SEEN_KEY = 'rewind_rules_seen';

export function saveGameState(state: GameState): void {
  const all = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || '{}');
  all[state.puzzleId] = state;
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(all));
}

export function loadGameState(puzzleId: string): GameState | null {
  const all = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || '{}');
  return all[puzzleId] || null;
}

export function clearGameState(puzzleId: string): void {
  const all = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || '{}');
  delete all[puzzleId];
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(all));
}

export function clearAllGameStates(): void {
  localStorage.removeItem(GAME_STATE_KEY);
}

export function pruneOldGameStates(currentPuzzleId: string): void {
  const all = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || '{}');
  const keys = Object.keys(all);
  let changed = false;
  for (const key of keys) {
    if (key !== currentPuzzleId) {
      delete all[key];
      changed = true;
    }
  }
  if (changed) {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(all));
  }
}

const DEFAULT_STATS: PlayerStats = {
  currentStreak: 0,
  maxStreak: 0,
  gamesPlayed: 0,
  lastPlayedDate: null,
};

export function loadStats(): PlayerStats {
  const raw = localStorage.getItem(STATS_KEY);
  if (!raw) return { ...DEFAULT_STATS };
  return JSON.parse(raw);
}

export function saveStats(stats: PlayerStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function updateStatsAfterGame(dateStr: string): PlayerStats {
  const stats = loadStats();
  stats.gamesPlayed += 1;

  if (stats.lastPlayedDate) {
    const last = new Date(stats.lastPlayedDate).getTime();
    const today = new Date(dateStr).getTime();
    const daysDiff = Math.floor((today - last) / 86_400_000);
    if (daysDiff === 1) {
      stats.currentStreak += 1;
    } else if (daysDiff > 1) {
      stats.currentStreak = 1;
    }
  } else {
    stats.currentStreak = 1;
  }

  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  stats.lastPlayedDate = dateStr;
  saveStats(stats);
  return stats;
}

export function hasSeenRules(): boolean {
  return localStorage.getItem(RULES_SEEN_KEY) === '1';
}

export function markRulesSeen(): void {
  localStorage.setItem(RULES_SEEN_KEY, '1');
}
