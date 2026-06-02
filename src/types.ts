export interface GameEvent {
  text: string;
  year: number;
  detail?: string;
}

export interface Puzzle {
  id: string;
  number: number;
  sport: 'nba' | 'nfl' | 'soccer';
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

export type ResultColor = 'correct' | 'close' | 'wrong';

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
