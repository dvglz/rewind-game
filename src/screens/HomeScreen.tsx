import { useMemo, useState, useRef } from 'react';
import { loadStats, loadGameState } from '../engine/storage';
import { getTodayString } from '../lib/date';
import { getSport, SPORT_LABELS, type Sport } from '../data/puzzles';
import styles from './HomeScreen.module.css';

interface HomeScreenProps {
  onPlay: () => void;
}

export function HomeScreen({ onPlay }: HomeScreenProps) {
  const stats = useMemo(() => loadStats(), []);
  const currentSport = getSport();
  const todayState = useMemo(() => loadGameState(`${getTodayString()}-${currentSport}`), [currentSport]);
  const alreadyPlayed = todayState?.completed ?? false;

  // Hidden sport picker — triple tap wordmark to reveal
  const [showSportPicker, setShowSportPicker] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleWordmarkTap = () => {
    tapCount.current += 1;
    if (tapCount.current >= 3) {
      setShowSportPicker((prev) => !prev);
      tapCount.current = 0;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      return;
    }
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 1000);
  };

  const switchSport = (sport: Sport) => {
    const url = new URL(window.location.href);
    url.searchParams.set('sport', sport);
    window.location.href = url.toString();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.wordmark} onClick={handleWordmarkTap}>
        Rewind
      </h1>

      {showSportPicker && (
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['nba', 'soccer'] as Sport[]).map((sport) => (
            <button
              key={sport}
              onClick={() => switchSport(sport)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                padding: '8px 16px',
                border: sport === currentSport ? '2px solid var(--color-text)' : '1px solid var(--color-border)',
                background: sport === currentSport ? 'var(--color-text)' : 'transparent',
                color: sport === currentSport ? 'var(--color-bg)' : 'var(--color-text)',
                borderRadius: '999px',
                cursor: 'pointer',
              }}
            >
              {SPORT_LABELS[sport]}
            </button>
          ))}
        </div>
      )}

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
