import type { GroupLeaderboardEntry } from '../types';
import styles from './GroupLeaderboard.module.css';

interface GroupLeaderboardProps {
  entries: GroupLeaderboardEntry[];
  emptyMessage?: string;
}

export function GroupLeaderboard({ entries, emptyMessage }: GroupLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <p className={styles.empty}>
        {emptyMessage ?? 'Believe it or not,\nno one played that day'}
      </p>
    );
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.score !== null && b.score !== null) return b.score - a.score;
    if (a.score !== null) return -1;
    if (b.score !== null) return 1;
    return 0;
  });

  return (
    <div className={styles.list}>
      {sorted.map((entry, i) => {
        const rank = entry.score !== null ? i + 1 : null;
        return (
          <div
            key={entry.displayName}
            className={`${styles.row} ${entry.isCurrentUser ? styles.rowHighlight : ''}`}
          >
            <div className={styles.userInfo}>
              <span className={styles.rank}>{rank ?? '––'}</span>
              <span className={styles.name}>{entry.displayName}</span>
            </div>
            <span className={`${styles.score} ${entry.score === null ? styles.notPlayed : ''}`}>
              {entry.score !== null ? entry.score.toLocaleString() : 'DNP'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
