import type { RoundResult, PlayerStats } from '../types';
import { getResultColor, getResultEmoji, getResultLabel } from '../engine/scoring';
import styles from './ShareCard.module.css';

interface ShareCardProps {
  puzzleNumber: number;
  results: RoundResult[];
  totalScore: number;
  maxScore: number;
  stats: PlayerStats;
  sport?: 'american' | 'soccer';
}

export function ShareCard({ puzzleNumber, results, totalScore, maxScore, stats }: ShareCardProps) {
  const emojiRow = results
    .map((r) => getResultEmoji(getResultColor(r.diff)))
    .join(' ');
  const scorePercent = Math.round((totalScore / maxScore) * 100);

  return (
    <div className={styles.card}>
      <span className={styles.title}>Rewind #{String(puzzleNumber).padStart(3, '0')}</span>
      <span className={styles.emojiRow}>{emojiRow}</span>
      <span className={styles.score}>
        {totalScore.toLocaleString()}
        <span className={styles.scoreMax}>/{maxScore.toLocaleString()}</span>
      </span>
      <span className={styles.scoreMeta}>{scorePercent}% of max possible</span>
      {stats.currentStreak > 1 && (
        <span className={styles.streak}>🔥 {stats.currentStreak}-day streak</span>
      )}

      <div className={styles.roundList}>
        {results.map((r, i) => (
          <div key={i} className={styles.roundRow}>
            <span>{getResultEmoji(getResultColor(r.diff))}</span>
            <span className={styles.roundEvent}>Round {i + 1}</span>
            <span className={styles.roundDiff}>
              {getResultLabel(getResultColor(r.diff))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
