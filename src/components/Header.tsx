import { RoundDots } from './RoundDots';
import styles from './Header.module.css';

interface HeaderProps {
  onHome?: () => void;
  leftMeta?: string;
  gameNumber?: number;
  rightText?: string;
  rightLabel?: string;
  scorePopping?: boolean;
  onScoreAnimationEnd?: () => void;
  onRules?: () => void;
  timerText?: string;
  roundState?: { results: { diff: number }[]; currentRound: number; totalRounds: number };
}

export function Header({
  onHome,
  leftMeta,
  gameNumber,
  rightText,
  rightLabel,
  scorePopping,
  onScoreAnimationEnd,
  onRules,
  timerText,
  roundState,
}: HeaderProps) {
  const today = new Date();
  const formatted = today
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.headerLeft}>
          <div className={styles.brand}>
            {onHome ? (
              <button
                className={`${styles.wordmark} ${styles.wordmarkAction}`}
                onClick={onHome}
                type="button"
              >
                REWIND
              </button>
            ) : (
              <span className={styles.wordmark}>REWIND</span>
            )}
            {gameNumber != null && (
              <span className={styles.gameNumber}>#{String(gameNumber).padStart(3, '0')}</span>
            )}
            {leftMeta && <span className={styles.meta}>{leftMeta}</span>}
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
          {roundState && (
            <RoundDots
              results={roundState.results}
              currentRound={roundState.currentRound}
              totalRounds={roundState.totalRounds}
            />
          )}
        </div>
        <div className={styles.headerRight}>
          {rightLabel && <span className={styles.scoreLabel}>{rightLabel}</span>}
          <span
            className={`${styles.date} ${scorePopping ? styles.scorePop : ''}`}
            onAnimationEnd={onScoreAnimationEnd}
            data-testid="header-score"
          >
            {rightText ?? formatted}
          </span>
          {timerText && (
            <span className={styles.totalTime}>
              <span className={styles.totalTimeLabel}>TOTAL TIME:</span>{' '}
              <span data-testid="game-timer">{timerText}</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
