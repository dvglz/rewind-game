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

export type ResultTier = 'perfect' | 'great' | 'ballpark' | 'wrong-era' | 'not-even-close';
export type ResultColor = ResultTier;

export interface GameState {
  puzzleId: string;
  currentRound: number;
  results: RoundResult[];
  totalScore: number;
  completed: boolean;
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
  email: string;
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
  members: GroupMember[];
}

export interface GroupLeaderboardEntry {
  displayName: string;
  score: number | null;
  isCurrentUser: boolean;
}

export type { AuthUser } from './types/auth';
