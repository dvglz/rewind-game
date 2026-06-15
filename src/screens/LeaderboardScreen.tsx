import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../lib/leaderboard';
import { formatTime } from '../lib/formatTime';
import { LEADERBOARD_PAGE_LIMIT } from '../config/leaderboard';
import { GroupLeaderboard } from '../components/GroupLeaderboard';
import { DateSelector } from '../components/DateSelector';
import { ArrowLeft } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import type { GlobalLeaderboard, GroupLeaderboardEntry } from '../types';
import styles from './LeaderboardScreen.module.css';

interface LeaderboardScreenProps {
  onBack: () => void;
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const { user: authUser } = useAuth();
  const [dayOffset, setDayOffset] = useState(0);
  const [board, setBoard] = useState<GlobalLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeaderboard(dayOffset)
      .then((b) => { if (!cancelled) setBoard(b); })
      .catch(() => { if (!cancelled) setBoard(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dayOffset]);

  const entries: GroupLeaderboardEntry[] = (board?.entries ?? []).map((e) => ({
    displayName: e.displayName,
    score: e.score,
    time: formatTime(e.timeMs),
    isCurrentUser: e.isCurrentUser,
  }));

  const pinnedEntry =
    board?.currentUser && board.currentUser.rank > LEADERBOARD_PAGE_LIMIT
      ? {
          rank: board.currentUser.rank,
          displayName: authUser?.username ?? board.currentUser.displayName,
          score: board.currentUser.score,
          time: formatTime(board.currentUser.timeMs),
        }
      : undefined;

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={onBack} type="button" aria-label="Back">
          <ArrowLeft />
        </button>
        <button className={styles.wordmarkButton} onClick={onBack} type="button">
          <span className={styles.wordmark}>REWIND</span>
        </button>
        <span className={styles.topBarSpacer} />
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Leaderboard</h1>

        <DateSelector
          dayOffset={dayOffset}
          onPrev={() => setDayOffset((d) => d + 1)}
          onNext={() => setDayOffset((d) => Math.max(0, d - 1))}
        />

        <div className={styles.leaderboardArea}>
          {!loading && (
            <GroupLeaderboard
              entries={entries}
              pinnedEntry={pinnedEntry}
              emptySeed={`lb-${dayOffset}`}
            />
          )}
        </div>

        {!loading && entries.length > 0 && (
          <p className={styles.disclaimer}>
            No ties: when scores match, the fastest completion time ranks higher — and if
            that's tied too, whoever submitted first takes the spot.
          </p>
        )}
      </div>
    </div>
  );
}
