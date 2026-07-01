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
  onRules?: () => void;
  timerText?: string;
}

export function Header({ sport, onHome, leftMeta, gameNumber, rightText, rightLabel, scorePopping, onScoreAnimationEnd, onRules, timerText }: HeaderProps) {
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
          {onHome ? (
            <button className={`${styles.wordmark} ${styles.wordmarkAction}`} onClick={onHome} type="button">
              REWIND
            </button>
          ) : (
            <span className={styles.wordmark}>REWIND</span>
          )}
          {gameNumber != null && (
            <span className={styles.gameNumber}>#{String(gameNumber).padStart(3, '0')}</span>
          )}
          {leftMeta && <span className={styles.meta}>{leftMeta}</span>}
          {sport && SPORT_ICONS[sport] && (
            <span className={styles.sportIcon} aria-hidden="true">
              {SPORT_ICONS[sport]}
            </span>
          )}
          {onRules && (
            <button
              type="button"
              className={styles.rulesButton}
              onClick={onRules}
              aria-label="How to play"
            >
              ?
            </button>
          )}
        </div>
        <div className={styles.scoreCol}>
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
          {timerText && (
            <span className={styles.timer} data-testid="game-timer">
              {timerText}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
