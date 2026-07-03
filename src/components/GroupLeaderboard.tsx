import type { GroupLeaderboardEntry } from '../types';
import styles from './GroupLeaderboard.module.css';

const EMPTY_LINES: string[] = [
  'Believe it or not,\nno one played that day',
  'Looks like everyone\nsat this one out.',
  'No plays on the board\n(yet?)',
  'This day got benched.',
  'Rest day.\nEven champs need one.',
];

function pickEmptyMessage(seed: string): string {
  // Deterministic pick based on the seed so it doesn't change on re-render
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return EMPTY_LINES[Math.abs(hash) % EMPTY_LINES.length];
}

interface GroupLeaderboardProps {
  entries: GroupLeaderboardEntry[];
  /** Seed string for deterministic random empty message (e.g. date string) */
  emptySeed?: string;
  /** Show sign-in CTA for unauthenticated users */
  authCta?: { text: string; onPress: () => void };
  /** A row pinned above the table (e.g. the current user when ranked outside the page). */
  pinnedEntry?: { rank: number; displayName: string; score: number; time?: string };
}

export function GroupLeaderboard({ entries, emptySeed, authCta, pinnedEntry }: GroupLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <p className={styles.empty}>
        {pickEmptyMessage(emptySeed ?? 'default')}
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
      {pinnedEntry && (
        <>
          <div className={`${styles.row} ${styles.pinnedRow}`}>
            <div className={styles.userInfo}>
              <span className={styles.rank}>{pinnedEntry.rank}</span>
              <span className={styles.name}>{pinnedEntry.displayName}</span>
              {pinnedEntry.time && <span className={styles.meta}>{pinnedEntry.time}</span>}
            </div>
            <span className={styles.score}>{pinnedEntry.score.toLocaleString()}</span>
          </div>
          <div className={styles.pinnedGap} aria-hidden="true" />
        </>
      )}
      {sorted.map((entry, i) => {
        const score = entry.score;
        const rank = score !== null ? i + 1 : null;
        const isDnp = score === null;
        return (
          <div
            key={entry.displayName}
            className={`${styles.row} ${entry.isCurrentUser ? styles.rowHighlight : ''} ${isDnp ? styles.rowNotPlayed : ''}`}
          >
            <div className={styles.userInfo}>
              <span className={`${styles.rank} ${rank === null ? styles.rankMuted : ''}`}>{rank ?? '––'}</span>
              <span className={styles.name}>{entry.displayName}</span>
              {entry.time && <span className={styles.meta}>{entry.time}</span>}
            </div>
            <span className={`${styles.score} ${isDnp ? styles.notPlayed : ''}`}>
              {score === null ? 'DNP' : score.toLocaleString()}
            </span>
          </div>
        );
      })}
      {authCta && (
        <button className={styles.ctaRow} onClick={authCta.onPress} type="button">
          {authCta.text}
        </button>
      )}
    </div>
  );
}
