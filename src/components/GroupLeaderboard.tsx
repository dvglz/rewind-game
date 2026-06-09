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
}

export function GroupLeaderboard({ entries, emptySeed, authCta }: GroupLeaderboardProps) {
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
      {sorted.map((entry, i) => {
        const rank = entry.score !== null ? i + 1 : null;
        return (
          <div
            key={entry.displayName}
            className={`${styles.row} ${entry.isCurrentUser ? styles.rowHighlight : ''}`}
          >
            <div className={styles.userInfo}>
              <span className={`${styles.rank} ${rank === null ? styles.rankMuted : ''}`}>{rank ?? '––'}</span>
              <span className={styles.name}>{entry.displayName}</span>
            </div>
            <span className={`${styles.score} ${entry.score === null ? styles.notPlayed : ''}`}>
              {entry.score !== null ? entry.score.toLocaleString() : 'DNP'}
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
