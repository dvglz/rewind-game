import type { RoundResult } from '../types';
import { getResultColor, getResultEmoji, getAccuracyLabel, getScoreTierLabel } from '../engine/scoring';
import styles from './ShareCard.module.css';

interface ShareCardProps {
  results: RoundResult[];
  totalScore: number;
  maxScore: number;
}

export function ShareCard({
  results,
  totalScore,
  maxScore,
}: ShareCardProps) {
  const tierLabel = getScoreTierLabel(totalScore, maxScore)
    .replace(/!/g, '')
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());

  return (
    <div className={styles.card}>
      <div className={styles.scoreBlock} style={{ animationDelay: '0ms' }}>
        <span className={styles.score}>
          {totalScore.toLocaleString()}
          <span className={styles.scoreMax}>/ {maxScore.toLocaleString()}</span>
        </span>
        <span className={styles.tierLabel}>{tierLabel}</span>
      </div>

      <div className={styles.questionList}>
        {results.map((r, i) => (
          <div
            key={i}
            className={styles.questionRow}
            style={{ animationDelay: `${200 + i * 80}ms` }}
          >
            <span className={styles.questionEmoji}>
              {getResultEmoji(getResultColor(r.diff))}
            </span>
            <div className={styles.questionText}>
              <span className={styles.questionLabel}>Question {i + 1}</span>
              <span className={styles.questionAccuracy}>
                {getAccuracyLabel(r.diff)}
              </span>
            </div>
            <span className={styles.questionScore}>{r.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
