import type { Sport } from '../data/puzzles';
import { SPORT_ICONS } from '../data/puzzles';
import styles from './Header.module.css';

interface HeaderProps {
  sport?: Sport;
  onHome?: () => void;
  leftMeta?: string;
  gameNumber?: number;
  rightText?: string;
  rightLabel?: string;
  scorePopping?: boolean;
  onScoreAnimationEnd?: () => void;
}

export function Header({ sport, onHome, leftMeta, gameNumber, rightText, rightLabel, scorePopping, onScoreAnimationEnd }: HeaderProps) {
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
          {gameNumber != null && (
            <span className={styles.gameNumber}>#{gameNumber}</span>
          )}
          {leftMeta && <span className={styles.meta}>{leftMeta}</span>}
          {sport && (
            <span className={styles.sportIcon} aria-hidden="true">
              {SPORT_ICONS[sport]}
            </span>
          )}
        </div>
        <div className={styles.scoreWrap}>
          {rightLabel && <span className={styles.scoreLabel}>{rightLabel}</span>}
          <span
            className={`${styles.date} ${scorePopping ? styles.scorePop : ''}`}
            onAnimationEnd={onScoreAnimationEnd}
            data-testid="header-score"
          >
            {rightText ?? formatted}
          </span>
        </div>
      </div>
    </header>
  );
}
