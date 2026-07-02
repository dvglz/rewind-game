import type { RoundResult } from '../types';
import { getResultColor, getResultColorVar, getAccuracyLabel } from '../engine/scoring';
import styles from './RoundBreakdown.module.css';

interface RoundBreakdownProps {
  results: RoundResult[];
}

export function RoundBreakdown({ results }: RoundBreakdownProps) {
  return (
    <div className={styles.list} data-testid="round-list">
      {results.map((result, index) => (
        <div
          key={`${index}-${result.event.text}`}
          className={styles.row}
          data-testid="breakdown-row"
        >
          <div className={styles.info}>
            <span className={styles.label}>Round {index + 1}</span>
            <span
              className={styles.accuracy}
              style={{ color: getResultColorVar(getResultColor(result.diff)) }}
            >
              {getAccuracyLabel(result.diff)}
            </span>
          </div>
          <span className={styles.score}>{result.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
