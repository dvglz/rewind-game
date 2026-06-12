import type { GlobalLeaderboard, GlobalLeaderboardEntry } from '../types';
import { LEADERBOARD_PAGE_LIMIT } from '../config/leaderboard';

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

export async function fetchLeaderboard(dayOffset: number): Promise<GlobalLeaderboard> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return mockBoard(dayOffset);
  }
  // Real API wired later (GET /leaderboard/?date=...). See spec "Deferred to Backend".
  throw new Error('Leaderboard API not wired yet — set VITE_MOCK_API=true for now');
}

/**
 * Seam for the post-login flush of an anonymous score (localStorage -> POST /scores/).
 * Intentionally a no-op until the backend is wired. See spec "Deferred to Backend".
 */
export async function flushPendingScore(): Promise<void> {
  // No-op placeholder. Real implementation reads the stored payload, POSTs it with the
  // ORIGINAL started_at/total_time, swallows stale-date rejections, then clears storage.
}
