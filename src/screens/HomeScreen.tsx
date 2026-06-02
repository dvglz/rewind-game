import { useMemo } from 'react';
import { loadStats, loadGameState } from '../engine/storage';
import { getTodayString } from '../lib/date';
import styles from './HomeScreen.module.css';

interface HomeScreenProps {
  onPlay: () => void;
}

export function HomeScreen({ onPlay }: HomeScreenProps) {
  const stats = useMemo(() => loadStats(), []);
  const todayState = useMemo(() => loadGameState(getTodayString()), []);
  const alreadyPlayed = todayState?.completed ?? false;

  return (
    <div className={styles.container}>
      <h1 className={styles.wordmark}>Rewind</h1>
      <p className={styles.tagline}>
        Guess the year. No typing. Just scroll.
      </p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.gamesPlayed}</span>
          <span className={styles.statLabel}>Played</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.currentStreak}</span>
          <span className={styles.statLabel}>Streak</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.maxStreak}</span>
          <span className={styles.statLabel}>Best</span>
        </div>
      </div>

      {alreadyPlayed ? (
        <>
          <span className={styles.completedBadge}>Today's puzzle complete ✓</span>
          <button className={styles.playButton} onClick={onPlay}>
            View Results
          </button>
        </>
      ) : (
        <button className={styles.playButton} onClick={onPlay}>
          Play
        </button>
      )}
    </div>
  );
}
