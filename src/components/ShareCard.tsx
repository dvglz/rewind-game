import type { CSSProperties } from 'react';
import type { RoundResult } from '../types';
import { getResultColor, getResultColorVar, getAccuracyLabel } from '../engine/scoring';
import { formatTime } from '../lib/formatTime';
import { RoundDots } from './RoundDots';
import styles from './ShareCard.module.css';

interface ShareCardProps {
  results: RoundResult[];
  totalScore: number;
  maxScore: number;
  dateLabel?: string;
  elapsedMs?: number;
  /**
   * Which parts to render. 'full' (default) shows the score summary and the
   * round-by-round breakdown together; 'summary' and 'breakdown' render each
   * half on its own so the breakdown can sit lower on the results screen.
   */
  section?: 'full' | 'summary' | 'breakdown';
  /** Delay (ms) for the first breakdown row's fade-in; each row staggers +80ms. */
  rowDelayBase?: number;
}

export function ShareCard({
  results,
  totalScore,
  maxScore,
  dateLabel,
  elapsedMs,
  section = 'full',
  rowDelayBase = 180,
}: ShareCardProps) {
  const showSummary = section !== 'breakdown';
  const showBreakdown = section !== 'summary';

  return (
    <div className={styles.card}>
      {showSummary && (
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
          <RoundDots
            results={results}
            currentRound={results.length}
            totalRounds={results.length}
            style={{ '--round-dot-size': '20px', '--round-dot-gap': '10px' } as CSSProperties}
          />
        </div>
      )}

      {showBreakdown && (
        <div className={styles.roundList} data-testid="round-list">
          {results.map((result, index) => (
            <div
              key={`${index}-${result.event.text}`}
              className={styles.roundRow}
              style={{ animationDelay: `${rowDelayBase + index * 80}ms` }}
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
      )}
    </div>
  );
}
