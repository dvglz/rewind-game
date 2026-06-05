import { useMemo, useState } from 'react';
import {
  getSport,
  isRandomModeEnabled,
  setRandomModeEnabled,
  SPORT_LABELS,
  type Sport,
} from '../data/puzzles';
import styles from './HomeScreen.module.css';

interface HomeScreenProps {
  onPlay: () => void;
  hasInProgressGame: boolean;
}

export function HomeScreen({ onPlay, hasInProgressGame }: HomeScreenProps) {
  const currentSport = getSport();
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const [randomEnabled, setRandomEnabled] = useState(() => isRandomModeEnabled());

  const sportOptions = useMemo(() => ['american', 'soccer'] as Sport[], []);

  const switchSport = (sport: Sport) => {
    const url = new URL(window.location.href);
    url.searchParams.set('sport', sport);
    window.location.assign(url.toString());
  };

  const toggleRandom = () => {
    const next = !randomEnabled;
    setRandomEnabled(next);
    setRandomModeEnabled(next);
  };

  // Format today's date nicely
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <h1 className={styles.wordmark}>Rewind</h1>

        <p className={styles.date}>{dateStr}</p>
      </div>

      <div className={styles.description}>
        <p>Quick daily game.</p>
        <p>Scroll to the year it happened.</p>
        <p>5 rounds.</p>
      </div>

      <button className={styles.playButton} onClick={onPlay}>
        {hasInProgressGame ? 'Resume' : 'Start'}
      </button>

      <button
        className={styles.debugToggle}
        onClick={() => setShowDebugMenu((prev) => !prev)}
        type="button"
      >
        {showDebugMenu ? 'Hide Debug' : 'Debug'}
      </button>

      {showDebugMenu && (
        <div className={styles.debugMenu}>
          <span className={styles.debugTitle}>Debug</span>
          <label className={styles.toggleRow}>
            <span>Random questions</span>
            <input
              type="checkbox"
              checked={randomEnabled}
              onChange={toggleRandom}
            />
          </label>
          <div className={styles.sportPicker}>
            {sportOptions.map((sport) => (
              <button
                key={sport}
                onClick={() => switchSport(sport)}
                className={sport === currentSport ? styles.sportButtonActive : styles.sportButton}
              >
                {SPORT_LABELS[sport]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
