import { getAccessToken } from './auth';

const BASE_URL = (import.meta.env.VITE_BASE_URL as string) ?? '';
const DETAIL_STALE_PATTERNS = ['stale', 'already submitted', 'duplicate'];

export const GAME_TYPE = 'REWIND';
export const GAME_MODE = 'rewind_nba';
export const PENDING_SCORE_KEY = 'rewind_pending_score';
export const SUBMITTED_PREFIX = 'rewind_score_submitted_';

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
    return typeof body.detail === 'string' ? body.detail : '';
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

export async function submitScore(payload: ScorePayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/playhub/scores/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await parseDetail(res);
    throw new Error(detail || 'Failed to submit score');
  }
}

export async function fetchMyScore(date: string): Promise<MyScoreResponse | null> {
  if (!getAccessToken()) return null;

  const res = await fetch(
    `${BASE_URL}/playhub/scores/?game_type=${GAME_TYPE}&game_mode=${GAME_MODE}&date=${date}`,
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

export async function fetchLeaderboardApi(groupId?: number): Promise<LeaderboardApiResponse> {
  const params = new URLSearchParams({
    game_type: GAME_TYPE,
    game_mode: GAME_MODE,
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

export async function fetchLeaderboardById(id: number, groupId?: number): Promise<LeaderboardApiResponse> {
  const params = new URLSearchParams({
    game_type: GAME_TYPE,
  });
  if (groupId != null) {
    params.set('group_id', String(groupId));
  }

  const res = await fetch(`${BASE_URL}/playhub/leaderboard/${id}/?${params.toString()}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const detail = await parseDetail(res);
    throw new Error(detail || 'Failed to fetch leaderboard');
  }

  return res.json();
}

export function savePendingScore(payload: ScorePayload): void {
  localStorage.setItem(PENDING_SCORE_KEY, JSON.stringify(payload));
}

export function markScoreSubmitted(puzzleId: string): void {
  localStorage.setItem(`${SUBMITTED_PREFIX}${puzzleId}`, 'true');
}

export function isScoreSubmitted(puzzleId: string): boolean {
  return localStorage.getItem(`${SUBMITTED_PREFIX}${puzzleId}`) === 'true';
}

export function clearScoreSyncState(): void {
  localStorage.removeItem(PENDING_SCORE_KEY);

  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(SUBMITTED_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

export async function flushPendingScore(): Promise<void> {
  const raw = localStorage.getItem(PENDING_SCORE_KEY);
  if (!raw || !getAccessToken()) return;

  const payload: ScorePayload = JSON.parse(raw);
  const res = await fetch(`${BASE_URL}/playhub/scores/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    localStorage.removeItem(PENDING_SCORE_KEY);
    return;
  }

  const detail = await parseDetail(res);
  if (shouldClearPending(res.status, detail)) {
    localStorage.removeItem(PENDING_SCORE_KEY);
  }
}
