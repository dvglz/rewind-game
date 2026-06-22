import type { GlobalLeaderboard, GlobalLeaderboardEntry } from '../types';
import { LEADERBOARD_PAGE_LIMIT } from '../config/leaderboard';
import { fetchLeaderboardApi, fetchLeaderboardById } from './api';
import type { LeaderboardApiResponse } from './api';
import { getTodayString } from './date';

function usesMockApi(): boolean {
  return import.meta.env.VITE_MOCK_API === 'true';
}

// ── Helpers ────────────────────────────────────────────────

/** ISO `YYYY-MM-DD` for `dayOffset` days before `baseDate` (0 = baseDate).
 *  `baseDate` defaults to today in the backend's reset timezone (Pacific). */
function dateForOffset(dayOffset: number, baseDate = getTodayString()): string {
  const d = new Date(`${baseDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dayOffset);
  return d.toISOString().slice(0, 10);
}

export function getDayOffsetFromToday(activeDate: string): number {
  const today = new Date(`${getTodayString()}T00:00:00Z`).getTime();
  const target = new Date(`${activeDate}T00:00:00Z`).getTime();
  const diffDays = Math.floor((today - target) / 86_400_000);
  return Math.max(0, diffDays);
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

  return { date, hasPrevious: true, entries, currentUser };
}

// ── Leaderboard ID cache ──────────────────────────────────
// Key: "global:{dayOffset}" or "group:{groupId}:{dayOffset}"
// Value: leaderboard ID from the backend.
// Populated as the user navigates days: offset 0 comes from the daily
// endpoint, offset N comes from previous_leaderboard_id of offset N-1.
const leaderboardIdCache = new Map<string, number>();

function cacheKey(dayOffset: number, groupId?: number): string {
  return groupId != null ? `group:${groupId}:${dayOffset}` : `global:${dayOffset}`;
}

// ── Response mapping ──────────────────────────────────────

function mapRow(row: Record<string, unknown>, index: number, isCurrent: boolean): GlobalLeaderboardEntry {
  return {
    rank: typeof row.place_scores === 'number'
      ? row.place_scores
      : typeof row.rank === 'number'
        ? row.rank
        : index + 1,
    displayName: typeof row.username === 'string'
      ? row.username
      : typeof row.display_name === 'string'
        ? row.display_name
        : isCurrent ? 'You' : `Player ${index + 1}`,
    score: typeof row.score === 'number'
      ? row.score
      : typeof row.scores === 'number'
        ? row.scores
        : 0,
    timeMs: typeof row.time === 'number'
      ? row.time
      : typeof row.time_ms === 'number'
        ? row.time_ms
        : typeof row.total_time === 'number'
          ? row.total_time * 1000
          : typeof row.metadata === 'object' && row.metadata !== null && typeof (row.metadata as { total_time?: unknown }).total_time === 'number'
            ? ((row.metadata as { total_time: number }).total_time * 1000)
            : 0,
    isCurrentUser: isCurrent,
  };
}

function mapResponse(raw: LeaderboardApiResponse): GlobalLeaderboard {
  // Identify the current user's in-page row by matching user_id against `me`,
  // so their row gets the subtle highlight even when they rank inside top-20.
  const meId = raw.me ? (raw.me as { user_id?: unknown }).user_id : undefined;
  const entries = (raw.top_20 ?? [])
    .slice(0, LEADERBOARD_PAGE_LIMIT)
    .map((row, i) =>
      mapRow(row, i, meId != null && (row as { user_id?: unknown }).user_id === meId),
    );

  const currentUser = raw.me ? mapRow(raw.me, 0, true) : null;
  const date = raw.leaderboard?.start_date ?? dateForOffset(0);
  const hasPrevious = raw.leaderboard?.previous_leaderboard_id != null;

  return { date, hasPrevious, entries, currentUser };
}

/** Cache the leaderboard ID at `offset` and its previous pointer at `offset+1`. */
function cacheFromResponse(raw: LeaderboardApiResponse, offset: number, groupId?: number): void {
  if (!raw.leaderboard) return;
  leaderboardIdCache.set(cacheKey(offset, groupId), raw.leaderboard.id);
  if (raw.leaderboard.previous_leaderboard_id != null) {
    leaderboardIdCache.set(cacheKey(offset + 1, groupId), raw.leaderboard.previous_leaderboard_id);
  }
}

// ── Public API ─────────────────────────────────────────────

export async function fetchLeaderboard(dayOffset: number, groupId?: number): Promise<GlobalLeaderboard> {
  if (usesMockApi()) {
    await new Promise((r) => setTimeout(r, 300));
    return mockBoard(dayOffset);
  }

  // dayOffset 0 → current daily leaderboard
  if (dayOffset === 0) {
    const raw = await fetchLeaderboardApi(groupId);
    cacheFromResponse(raw, 0, groupId);
    return mapResponse(raw);
  }

  // dayOffset > 0 → walk the chain via previous_leaderboard_id
  if (!leaderboardIdCache.has(cacheKey(dayOffset, groupId))) {
    // Fill the chain from the closest cached offset
    let closest = dayOffset - 1;
    while (closest >= 0 && !leaderboardIdCache.has(cacheKey(closest, groupId))) {
      closest--;
    }
    // If nothing is cached, fetch today first
    if (closest < 0) {
      const todayRaw = await fetchLeaderboardApi(groupId);
      cacheFromResponse(todayRaw, 0, groupId);
      closest = 0;
    }
    // Walk forward from closest cached to fill up to dayOffset
    for (let i = closest + 1; i <= dayOffset; i++) {
      const prevId = leaderboardIdCache.get(cacheKey(i, groupId));
      if (!prevId) break; // no further history
      const prevRaw = await fetchLeaderboardById(prevId, groupId);
      cacheFromResponse(prevRaw, i, groupId);
    }
  }

  const targetId = leaderboardIdCache.get(cacheKey(dayOffset, groupId));
  if (!targetId) {
    // No leaderboard exists that far back
    return { date: dateForOffset(dayOffset), hasPrevious: false, entries: [], currentUser: null };
  }

  const raw = await fetchLeaderboardById(targetId, groupId);
  cacheFromResponse(raw, dayOffset, groupId);
  return mapResponse(raw);
}
