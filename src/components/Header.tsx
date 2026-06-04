import type { Sport } from '../data/puzzles';
import { SPORT_ICONS } from '../data/puzzles';
import styles from './Header.module.css';

interface HeaderProps {
  sport?: Sport;
  onHome?: () => void;
}

export function Header({ sport, onHome }: HeaderProps) {
  const today = new Date();
  const formatted = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span
            className={styles.wordmark}
            onClick={onHome}
            style={onHome ? { cursor: 'pointer' } : undefined}
          >
            REWIND
          </span>
          {sport && (
            <span className={styles.sportIcon} aria-hidden="true">
              {SPORT_ICONS[sport]}
            </span>
          )}
        </div>
        <span className={styles.date}>{formatted}</span>
      </div>
    </header>
  );
}
