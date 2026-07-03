import { getResultColor, getResultColorVar } from '../engine/scoring';
import styles from './RoundDots.module.css';

interface RoundDotsProps {
  results: { diff: number }[];
  currentRound: number;
  totalRounds: number;
  animatedDoneIndex?: number;
}

export function RoundDots({ results, currentRound, totalRounds, animatedDoneIndex }: RoundDotsProps) {
  return (
    <div className={styles.dots} aria-label="Round progress">
      {Array.from({ length: totalRounds }, (_, i) => {
        if (i < results.length) {
          const newlyCompleted = i === animatedDoneIndex;
          return (
            <span
              key={i}
              className={`${styles.dot} ${styles.done} ${newlyCompleted ? styles.doneAnimated : ''}`}
              data-testid="round-dot"
              data-state="done"
              style={{ background: getResultColorVar(getResultColor(results[i].diff)) }}
            />
          );
        }
        const isCurrent = i === currentRound;
        return (
          <span
            key={i}
            className={`${styles.dot} ${isCurrent ? styles.current : styles.upcoming}`}
            data-testid="round-dot"
            data-state={isCurrent ? 'current' : 'upcoming'}
          />
        );
      })}
    </div>
  );
}
