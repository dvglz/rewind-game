import type { RoundResult } from '../types';
import { getResultColor, getResultColorVar, getResultEmoji, getAccuracyLabel } from '../engine/scoring';
import { formatTime } from '../lib/formatTime';
import styles from './ShareCard.module.css';

interface ShareCardProps {
  results: RoundResult[];
  totalScore: number;
  maxScore: number;
  dateLabel?: string;
  elapsedMs?: number;
}

export function ShareCard({
  results,
  totalScore,
  maxScore,
  dateLabel,
  elapsedMs,
}: ShareCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header} style={{ animationDelay: '0ms' }}>
        {dateLabel ? <p className={styles.date}>{dateLabel}</p> : null}
        <div className={styles.scoreRow}>
          <span className={styles.score}>
            {totalScore.toLocaleString()}
            <span className={styles.scoreMax}> / {maxScore.toLocaleString()}</span>
            {elapsedMs !== undefined ? (
              <span className={styles.timePill}>{formatTime(elapsedMs)}</span>
            ) : null}
          </span>
        </div>
        <div className={styles.tierDots} aria-label="Round tiers">
          {results.map((result, index) => (
            <span key={`${index}-${result.event.text}`} data-testid="tier-dot">
              {getResultEmoji(getResultColor(result.diff))}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.roundList} data-testid="round-list">
        {results.map((result, index) => (
          <div
            key={`${index}-${result.event.text}`}
            className={styles.roundRow}
            style={{ animationDelay: `${180 + index * 80}ms` }}
          >
            <div className={styles.roundInfo}>
              <span className={styles.roundLabel}>Round {index + 1}</span>
              <span
                className={styles.roundAccuracy}
                style={{ color: getResultColorVar(getResultColor(result.diff)) }}
              >
                {getAccuracyLabel(result.diff)}
              </span>
            </div>
            <span className={styles.roundScore}>{result.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
