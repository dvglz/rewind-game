import type { GlobalLeaderboard, GlobalLeaderboardEntry } from '../types';
import { LEADERBOARD_PAGE_LIMIT } from '../config/leaderboard';
import { fetchLeaderboardApi } from './api';

const USE_MOCK = import.meta.env.VITE_MOCK_API === 'true';

// ── Helpers ────────────────────────────────────────────────

/** ISO `YYYY-MM-DD` for `dayOffset` days before today (0 = today). */
function dateForOffset(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  return d.toISOString().slice(0, 10);
}

/** Small seeded PRNG (mulberry32) so a date always yields the same board. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const NAME_POOL = [
  'Mike', 'Sarah', 'Jordan', 'Alex', 'Taylor', 'Chris', 'Sam', 'Jamie',
  'Casey', 'Riley', 'Drew', 'Morgan', 'Quinn', 'Avery', 'Reese', 'Parker',
  'Devin', 'Skyler', 'Hayden', 'Emerson', 'Rowan', 'Finley', 'Marlon', 'Dana',
];

/** Max achievable score for a day (5 rounds, normalized to 1000). */
const MAX_DAILY_SCORE = 1000;

function mockBoard(dayOffset: number): GlobalLeaderboard {
  const date = dateForOffset(dayOffset);
  const rng = seededRng(hashString(date));

  // 50..80 players for the day.
  const totalPlayers = 50 + Math.floor(rng() * 31);

  // Descending scores, capped at MAX_DAILY_SCORE and floored at 0.
  const scores: number[] = [];
  let score = MAX_DAILY_SCORE - Math.floor(rng() * 40); // top score 960..1000
  for (let i = 0; i < totalPlayers; i++) {
    scores.push(Math.max(0, score));
    score -= 2 + Math.floor(rng() * 16);
  }

  // Plausible completion times (45s..5m), independent of score.
  const times: number[] = scores.map(() => 45000 + Math.floor(rng() * 255000));

  const entries: GlobalLeaderboardEntry[] = scores
    .slice(0, LEADERBOARD_PAGE_LIMIT)
    .map((s, i) => ({
      rank: i + 1,
      displayName: NAME_POOL[i % NAME_POOL.length] + (i >= NAME_POOL.length ? ` ${Math.floor(i / NAME_POOL.length) + 1}` : ''),
      score: s,
      timeMs: times[i],
      isCurrentUser: false,
    }));

  // Mock "you" at a fixed rank outside the page so the pinned-row path is exercised.
  const userRank = Math.min(34, totalPlayers);
  const currentUser: GlobalLeaderboardEntry = {
    rank: userRank,
    displayName: 'You',
    score: scores[userRank - 1],
    timeMs: times[userRank - 1],
    isCurrentUser: true,
  };

  return { date, entries, currentUser };
}

// ── Public API ─────────────────────────────────────────────

export async function fetchLeaderboard(dayOffset: number, groupId?: number): Promise<GlobalLeaderboard> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return mockBoard(dayOffset);
  }

  const date = dateForOffset(dayOffset);
  const raw = await fetchLeaderboardApi(date, groupId) as {
    top_20?: Array<Record<string, unknown>>;
    me?: Record<string, unknown> | null;
  };

  const entries: GlobalLeaderboardEntry[] = (raw.top_20 ?? [])
    .slice(0, LEADERBOARD_PAGE_LIMIT)
    .map((row, index) => ({
      rank: typeof row.rank === 'number' ? row.rank : index + 1,
      displayName: typeof row.username === 'string'
        ? row.username
        : typeof row.display_name === 'string'
          ? row.display_name
          : `Player ${index + 1}`,
      score: typeof row.score === 'number'
        ? row.score
        : typeof row.scores === 'number'
          ? row.scores
          : 0,
      timeMs: typeof row.time === 'number'
        ? row.time
        : typeof row.time_ms === 'number'
          ? row.time_ms
          : typeof row.metadata === 'object' && row.metadata !== null && typeof (row.metadata as { total_time?: unknown }).total_time === 'number'
            ? ((row.metadata as { total_time: number }).total_time * 1000)
            : 0,
      isCurrentUser: false,
    }));

  const currentRaw = raw.me;
  const currentUser: GlobalLeaderboardEntry | null = currentRaw
    ? {
        rank: typeof currentRaw.rank === 'number' ? currentRaw.rank : 0,
        displayName: typeof currentRaw.username === 'string'
          ? currentRaw.username
          : typeof currentRaw.display_name === 'string'
            ? currentRaw.display_name
            : 'You',
        score: typeof currentRaw.score === 'number'
          ? currentRaw.score
          : typeof currentRaw.scores === 'number'
            ? currentRaw.scores
            : 0,
        timeMs: typeof currentRaw.time === 'number'
          ? currentRaw.time
          : typeof currentRaw.time_ms === 'number'
            ? currentRaw.time_ms
            : typeof currentRaw.metadata === 'object' && currentRaw.metadata !== null && typeof (currentRaw.metadata as { total_time?: unknown }).total_time === 'number'
              ? ((currentRaw.metadata as { total_time: number }).total_time * 1000)
              : 0,
        isCurrentUser: true,
      }
    : null;

  return { date, entries, currentUser };
}
