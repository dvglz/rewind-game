import type { GlobalLeaderboard, GlobalLeaderboardEntry } from '../types';
import { LEADERBOARD_PAGE_LIMIT, type LeaderboardPeriod } from '../config/leaderboard';
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

/** Max achievable score for a single day (5 rounds, normalized to 1000). */
const MAX_DAILY_SCORE = 1000;

/** Rough number of days aggregated into a period, for scaling mock score sums. */
function periodDays(period: LeaderboardPeriod): number {
  if (period === 'weekly') return 7;
  if (period === 'monthly') return 30;
  return 1;
}

/** ISO range covering the period `offset` steps before today. */
function mockPeriodRange(period: LeaderboardPeriod, offset: number): { startDate: string; endDate: string } {
  const span = periodDays(period);
  const endDate = dateForOffset(offset * span);
  const startDate = dateForOffset(offset * span + span - 1);
  return { startDate, endDate };
}

function mockBoard(period: LeaderboardPeriod, offset: number): GlobalLeaderboard {
  const { startDate, endDate } = mockPeriodRange(period, offset);
  const rng = seededRng(hashString(`${period}:${startDate}`));
  const maxScore = MAX_DAILY_SCORE * periodDays(period);

  // 50..80 players for the period.
  const totalPlayers = 50 + Math.floor(rng() * 31);

  // Descending scores, capped at maxScore and floored at 0.
  const scores: number[] = [];
  let score = maxScore - Math.floor(rng() * 40);
  for (let i = 0; i < totalPlayers; i++) {
    scores.push(Math.max(0, score));
    score -= 2 + Math.floor(rng() * 16);
  }

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

  const userRank = Math.min(34, totalPlayers);
  const currentUser: GlobalLeaderboardEntry = {
    rank: userRank,
    displayName: 'You',
    score: scores[userRank - 1],
    timeMs: times[userRank - 1],
    isCurrentUser: true,
  };

  return { date: startDate, startDate, endDate, hasPrevious: true, entries, currentUser };
}

// ── Leaderboard ID cache ──────────────────────────────────
// Key: built by cacheKey(period, offset, groupId?, gameMode?), e.g.
// "{period}:{gameMode}:global:{offset}" or "{period}:{gameMode}:group:{groupId}:{offset}".
// Value: leaderboard ID from the backend.
// Populated as the user navigates days/weeks/months: offset 0 comes from the
// current-period endpoint, offset N comes from previous_leaderboard_id of offset N-1.
const leaderboardIdCache = new Map<string, number>();

function cacheKey(period: LeaderboardPeriod, offset: number, groupId?: number, gameMode?: string): string {
  const base = groupId != null ? `group:${groupId}:${offset}` : `global:${offset}`;
  return `${period}:${gameMode ?? ''}:${base}`;
}

// ── Response mapping ──────────────────────────────────────

function mapRow(row: Record<string, unknown>, index: number, isCurrent: boolean): GlobalLeaderboardEntry {
  return {
    rank: typeof row.place_scores === 'number'
      ? row.place_scores
      : typeof row.rank === 'number'
        ? row.rank
        : index + 1,
    userId: typeof row.user_id === 'number' ? row.user_id : undefined,
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
  const startDate = raw.leaderboard?.start_date ?? dateForOffset(0);
  const endDate = raw.leaderboard?.end_date ?? startDate;
  const hasPrevious = raw.leaderboard?.previous_leaderboard_id != null;

  return { date: startDate, startDate, endDate, hasPrevious, entries, currentUser };
}

/** Cache the leaderboard ID at `offset` and its previous pointer at `offset+1`. */
function cacheFromResponse(raw: LeaderboardApiResponse, period: LeaderboardPeriod, offset: number, groupId?: number, gameMode?: string): void {
  if (!raw.leaderboard) return;
  leaderboardIdCache.set(cacheKey(period, offset, groupId, gameMode), raw.leaderboard.id);
  if (raw.leaderboard.previous_leaderboard_id != null) {
    leaderboardIdCache.set(cacheKey(period, offset + 1, groupId, gameMode), raw.leaderboard.previous_leaderboard_id);
  }
}

// ── Public API ─────────────────────────────────────────────

function mockApiFallbackRange(period: LeaderboardPeriod, offset: number): { startDate: string; endDate: string } {
  const span = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 1;
  return { startDate: dateForOffset(offset * span + span - 1), endDate: dateForOffset(offset * span) };
}

export async function fetchLeaderboard(
  offset: number,
  opts: { period?: LeaderboardPeriod; groupId?: number; gameMode?: string } = {},
): Promise<GlobalLeaderboard> {
  const { period = 'daily', groupId, gameMode } = opts;

  if (usesMockApi()) {
    await new Promise((r) => setTimeout(r, 300));
    return mockBoard(period, offset);
  }

  // offset 0 → current leaderboard for this period
  if (offset === 0) {
    const raw = await fetchLeaderboardApi(period, groupId, gameMode);
    cacheFromResponse(raw, period, 0, groupId, gameMode);
    return mapResponse(raw);
  }

  // offset > 0 → walk the chain via previous_leaderboard_id
  if (!leaderboardIdCache.has(cacheKey(period, offset, groupId, gameMode))) {
    let closest = offset - 1;
    while (closest >= 0 && !leaderboardIdCache.has(cacheKey(period, closest, groupId, gameMode))) {
      closest--;
    }
    if (closest < 0) {
      const todayRaw = await fetchLeaderboardApi(period, groupId, gameMode);
      cacheFromResponse(todayRaw, period, 0, groupId, gameMode);
      closest = 0;
    }
    for (let i = closest + 1; i <= offset; i++) {
      const prevId = leaderboardIdCache.get(cacheKey(period, i, groupId, gameMode));
      if (!prevId) break;
      const prevRaw = await fetchLeaderboardById(prevId, period, groupId, gameMode);
      cacheFromResponse(prevRaw, period, i, groupId, gameMode);
    }
  }

  const targetId = leaderboardIdCache.get(cacheKey(period, offset, groupId, gameMode));
  if (!targetId) {
    const { startDate, endDate } = mockApiFallbackRange(period, offset);
    return { date: startDate, startDate, endDate, hasPrevious: false, entries: [], currentUser: null };
  }

  const raw = await fetchLeaderboardById(targetId, period, groupId, gameMode);
  cacheFromResponse(raw, period, offset, groupId, gameMode);
  return mapResponse(raw);
}
