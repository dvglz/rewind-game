export interface GameEvent {
  text: string;
  year: number;
  detail?: string;
}

export interface Puzzle {
  id: string;
  number: number;
  sport: 'american' | 'soccer';
  theme?: string;
  events: GameEvent[];
}

export interface RoundResult {
  event: GameEvent;
  guessedYear: number;
  actualYear: number;
  diff: number;
  score: number;
}

export type ResultTier = 'perfect' | 'ballpark' | 'wrong-era' | 'not-even-close';
export type ResultColor = ResultTier;

export interface GameState {
  puzzleId: string;
  currentRound: number;
  results: RoundResult[];
  totalScore: number;
  completed: boolean;
  startedAt?: number;
  elapsedMs?: number;
}

export interface PlayerStats {
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  lastPlayedDate: string | null;
}

export interface GroupMemberUser {
  id: number;
  username: string;
  email?: string;
}

export interface GroupMember {
  group: number;
  user: string | GroupMemberUser;
  joined_at: string;
}

export interface PlayhubGroup {
  id: number;
  name: string;
  invite_link: string;
  joined_at?: string;
  members_count?: number | string;
  members: GroupMember[];
}

export interface GroupLeaderboardEntry {
  displayName: string;
  score: number | null;
  /** Optional formatted run time (e.g. "2m 39s") shown beside the name. */
  time?: string;
  isCurrentUser: boolean;
}

export interface GlobalLeaderboardEntry {
  /** Server-assigned global rank (1-based). */
  rank: number;
  /** Backend user id, when available. Used to merge group rosters with score rows. */
  userId?: number;
  displayName: string;
  score: number;
  /** Total completion time in milliseconds (tiebreaker + displayed per row). */
  timeMs: number;
  isCurrentUser: boolean;
}

export interface GlobalLeaderboard {
  /** ISO `YYYY-MM-DD` day this board is for. */
  date: string;
  /** Whether an older leaderboard exists via previous_leaderboard_id. */
  hasPrevious: boolean;
  /** Top-N rows, length <= LEADERBOARD_PAGE_LIMIT. */
  entries: GlobalLeaderboardEntry[];
  /** The signed-in user's own row, or null if not authed / no score that day. */
  currentUser: GlobalLeaderboardEntry | null;
}

export type { AuthUser } from './types/auth';
