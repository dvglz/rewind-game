import { useEffect, useState } from 'react';
import { fetchLeaderboard, getDayOffsetFromToday } from '../lib/leaderboard';
import { getDateOverride } from '../data/puzzles';
import { track } from '../lib/analytics';
import styles from './RankHook.module.css';

interface RankHookProps {
  isAuthenticated: boolean;
  claimHeadline: string;
  urgency: string | null;
  onClaim: () => void;
  onOpenLeaderboard: () => void;
}

export function RankHook({ isAuthenticated, claimHeadline, urgency, onClaim, onOpenLeaderboard }: RankHookProps) {
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetchLeaderboard(getDayOffsetFromToday(getDateOverride()))
      .then((board) => {
        if (!cancelled && board.currentUser) {
          setRank(board.currentUser.rank);
          track('rank_reveal', { rank: board.currentUser.rank });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Authenticated with a known rank → real, tappable rank.
  if (isAuthenticated) {
    if (rank === null) return null; // fetch pending or no score that day → hide
    return (
      <button type="button" className={styles.rank} onClick={onOpenLeaderboard}>
        <span className={styles.rankNumber}>#{rank}</span>
        <span className={styles.rankCaption}>today</span>
      </button>
    );
  }

  // Logged-out → blurred placeholder + claim CTA.
  return (
    <button type="button" className={styles.claim} onClick={onClaim}>
      <span className={styles.blurred} aria-hidden="true">#347</span>
      <span className={styles.claimHeadline}>{claimHeadline}</span>
      {urgency && <span className={styles.urgency}>{urgency}</span>}
    </button>
  );
}
