import { getAccessToken } from './auth';

const BASE_URL = (import.meta.env.VITE_BASE_URL as string) ?? '';
const DETAIL_STALE_PATTERNS = ['stale', 'already submitted', 'already been submitted', 'already played', 'duplicate'];

export const GAME_TYPE = 'REWIND';
export const GAME_MODE = 'rewind_nba';
export const PENDING_SCORE_KEY = 'rewind_pending_score';
export const PENDING_PUZZLE_KEY = 'rewind_pending_puzzle_id';
export const SUBMITTED_PREFIX = 'rewind_score_submitted_';
export const SUPERSEDED_PREFIX = 'rewind_score_superseded_';
export const CLAIM_PREFIX = 'rewind_claim_';

export interface RoundMetadata {
  event_text: string;
  guessed_year: number;
  actual_year: number;
  diff: number;
  score: number;
  tier: string;
}

export interface ScoreMetadata {
  total_time: number;
  puzzle_number: number;
  sport: string;
  rounds: RoundMetadata[];
}

export interface ScorePayload {
  game_type: string;
  game_mode: string;
  scores: number;
  metadata: ScoreMetadata;
}

export interface MyScoreResponse {
  scores: number;
  metadata: ScoreMetadata;
  created?: string;
  created_at?: string;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Token ${token}`;
  }
  return headers;
}

async function parseDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const detail = body?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.filter((x) => typeof x === 'string').join(' ');
    return '';
  } catch {
    return '';
  }
}

function shouldClearPending(status: number, detail: string): boolean {
  if (status === 409) return true;
  if (status !== 400) return false;

  const normalized = detail.toLowerCase();
  return DETAIL_STALE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export type SubmitResult = 'submitted' | 'duplicate';

export async function submitScore(payload: ScorePayload): Promise<SubmitResult> {
  const res = await fetch(`${BASE_URL}/playhub/scores/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (res.ok) return 'submitted';

  const detail = await parseDetail(res);
  if (shouldClearPending(res.status, detail)) return 'duplicate';
  throw new Error(detail || 'Failed to submit score');
}

export async function fetchMyScore(date: string, gameMode: string = GAME_MODE): Promise<MyScoreResponse | null> {
  if (!getAccessToken()) return null;

  const res = await fetch(
    `${BASE_URL}/playhub/scores/?game_type=${GAME_TYPE}&game_mode=${gameMode}&date=${date}`,
    { headers: getHeaders() },
  );

  if (!res.ok) return null;

  const body = await res.json();
  if (!Array.isArray(body) || body.length === 0) return null;
  return body[0] as MyScoreResponse;
}

export interface LeaderboardMeta {
  id: number;
  start_date: string;
  end_date: string;
  previous_leaderboard_id: number | null;
}

export interface LeaderboardApiResponse {
  leaderboard: LeaderboardMeta;
  top_20: Array<Record<string, unknown>>;
  me: Record<string, unknown> | null;
}

export async function fetchLeaderboardApi(groupId?: number, gameMode: string = GAME_MODE): Promise<LeaderboardApiResponse> {
  const params = new URLSearchParams({
    game_type: GAME_TYPE,
    game_mode: gameMode,
  });
  if (groupId != null) {
    params.set('group_id', String(groupId));
  }

  const res = await fetch(`${BASE_URL}/playhub/leaderboard/daily/scores/?${params.toString()}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const detail = await parseDetail(res);
    throw new Error(detail || 'Failed to fetch leaderboard');
  }

  return res.json();
}

export async function fetchLeaderboardById(id: number, groupId?: number, gameMode: string = GAME_MODE): Promise<LeaderboardApiResponse> {
  // Historical boards use path segments id/period/metric, with game_type/game_mode
  // as query params — same period ("daily") and metric ("scores") as the live board.
  const params = new URLSearchParams({
    game_type: GAME_TYPE,
    game_mode: gameMode,
  });
  if (groupId != null) {
    params.set('group_id', String(groupId));
  }

  const res = await fetch(`${BASE_URL}/playhub/leaderboard/${id}/daily/scores/?${params.toString()}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const detail = await parseDetail(res);
    throw new Error(detail || 'Failed to fetch leaderboard');
  }

  return res.json();
}

export function savePendingScore(payload: ScorePayload, puzzleId: string): void {
  localStorage.setItem(PENDING_SCORE_KEY, JSON.stringify(payload));
  localStorage.setItem(PENDING_PUZZLE_KEY, puzzleId);
}

export function markScoreSuperseded(puzzleId: string): void {
  localStorage.setItem(`${SUPERSEDED_PREFIX}${puzzleId}`, 'true');
}

export function isScoreSuperseded(puzzleId: string): boolean {
  return localStorage.getItem(`${SUPERSEDED_PREFIX}${puzzleId}`) === 'true';
}

export function markScoreSubmitted(puzzleId: string): void {
  localStorage.setItem(`${SUBMITTED_PREFIX}${puzzleId}`, 'true');
}

export function isScoreSubmitted(puzzleId: string): boolean {
  return localStorage.getItem(`${SUBMITTED_PREFIX}${puzzleId}`) === 'true';
}

export function markRewardClaimed(rewardKey: string, puzzleId: string): void {
  localStorage.setItem(`${CLAIM_PREFIX}${rewardKey}_${puzzleId}`, 'true');
}

export function isRewardClaimed(rewardKey: string, puzzleId: string): boolean {
  return localStorage.getItem(`${CLAIM_PREFIX}${rewardKey}_${puzzleId}`) === 'true';
}

export function clearScoreSyncState(): void {
  localStorage.removeItem(PENDING_SCORE_KEY);
  localStorage.removeItem(PENDING_PUZZLE_KEY);

  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (
      key?.startsWith(SUBMITTED_PREFIX) ||
      key?.startsWith(SUPERSEDED_PREFIX) ||
      key?.startsWith(CLAIM_PREFIX)
    ) {
      localStorage.removeItem(key);
    }
  }
}

export async function flushPendingScore(): Promise<void> {
  const raw = localStorage.getItem(PENDING_SCORE_KEY);
  if (!raw || !getAccessToken()) return;

  const payload: ScorePayload = JSON.parse(raw);
  const puzzleId = localStorage.getItem(PENDING_PUZZLE_KEY);
  const res = await fetch(`${BASE_URL}/playhub/scores/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    localStorage.removeItem(PENDING_SCORE_KEY);
    localStorage.removeItem(PENDING_PUZZLE_KEY);
    return;
  }

  const detail = await parseDetail(res);
  if (shouldClearPending(res.status, detail)) {
    if (puzzleId) markScoreSuperseded(puzzleId);
    localStorage.removeItem(PENDING_SCORE_KEY);
    localStorage.removeItem(PENDING_PUZZLE_KEY);
  }
}
