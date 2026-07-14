import { RoundDots } from './RoundDots';
import styles from './Header.module.css';

interface HeaderProps {
  onHome?: () => void;
  leftMeta?: string;
  gameNumber?: number;
  specialFlag?: string;
  rightText?: string;
  scorePopping?: boolean;
  onScoreAnimationEnd?: () => void;
  onRules?: () => void;
  timerText?: string;
  roundState?: {
    results: { diff: number }[];
    currentRound: number;
    totalRounds: number;
    animatedDoneIndex?: number;
  };
}

export function Header({
  onHome,
  leftMeta,
  gameNumber,
  specialFlag,
  rightText,
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
    <header
      className={`${styles.header} ${roundState ? styles.gameHeader : ''}`}
      data-testid="app-header"
    >
      <div className={styles.inner}>
        <div className={styles.headerLeft} data-testid="header-left">
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
            {specialFlag && (
              <span className={styles.specialFlag} role="img" aria-label="Special edition">
                {specialFlag}
              </span>
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
            <div className={styles.progress} data-testid="header-progress">
              <RoundDots
                results={roundState.results}
                currentRound={roundState.currentRound}
                totalRounds={roundState.totalRounds}
                animatedDoneIndex={roundState.animatedDoneIndex}
              />
            </div>
          )}
        </div>
        <div className={styles.headerRight} data-testid="header-right">
          <span
            className={`${styles.date} ${scorePopping ? styles.scorePop : ''}`}
            onAnimationEnd={onScoreAnimationEnd}
            data-testid="header-score"
          >
            {roundState && rightText ? <span className={styles.scoreLabel}>Score: </span> : null}
            {rightText ?? formatted}
          </span>
          {timerText && (
            <span className={styles.totalTime}>
              <span data-testid="game-timer">{timerText}</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
