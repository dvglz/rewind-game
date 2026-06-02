import { createClient } from '@supabase/supabase-js';
import type { RoundResult } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Guard against missing env vars — createClient throws if URL is empty
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  score: number;
  submittedAt: string;
}

export async function submitScore(
  puzzleId: string,
  score: number,
  results: RoundResult[],
): Promise<boolean> {
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from('scores').upsert({
    profile_id: user.id,
    puzzle_id: puzzleId,
    score,
    results,
  });

  return !error;
}

export async function getLeaderboard(puzzleId: string): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('scores')
    .select('score, submitted_at, profiles(display_name)')
    .eq('puzzle_id', puzzleId)
    .order('score', { ascending: false })
    .order('submitted_at', { ascending: true })
    .limit(50);

  if (error || !data) return [];

  return data.map((row: any, i: number) => ({
    rank: i + 1,
    displayName: row.profiles?.display_name || 'Anonymous',
    score: row.score,
    submittedAt: row.submitted_at,
  }));
}

export async function signInWithEmail(email: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.auth.signInWithOtp({ email });
  return !error;
}

export async function getUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
