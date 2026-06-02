import { useState } from 'react';
import type { RoundResult, PlayerStats } from '../types';
import { getResultColor, getResultEmoji } from '../engine/scoring';
import { generateShareText, shareResults } from '../lib/share';
import styles from './ShareCard.module.css';

interface ShareCardProps {
  puzzleNumber: number;
  results: RoundResult[];
  totalScore: number;
  stats: PlayerStats;
  sport?: 'nba' | 'soccer';
}

export function ShareCard({ puzzleNumber, results, totalScore, stats, sport = 'nba' }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const emojiRow = results
    .map((r) => getResultEmoji(getResultColor(r.diff)))
    .join(' ');

  const handleShare = async () => {
    const text = generateShareText(puzzleNumber, results, totalScore, stats.currentStreak, sport);
    const success = await shareResults(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.card}>
      <span className={styles.title}>Rewind #{String(puzzleNumber).padStart(3, '0')}</span>
      <span className={styles.emojiRow}>{emojiRow}</span>
      <span className={styles.score}>{totalScore.toLocaleString()}</span>
      {stats.currentStreak > 1 && (
        <span className={styles.streak}>🔥 {stats.currentStreak}-day streak</span>
      )}

      <div className={styles.roundList}>
        {results.map((r, i) => (
          <div key={i} className={styles.roundRow}>
            <span>{getResultEmoji(getResultColor(r.diff))}</span>
            <span className={styles.roundEvent}>{r.event.text}</span>
            <span className={styles.roundDiff}>
              {r.diff === 0 ? 'Exact' : r.diff > 0 ? `+${r.diff}` : r.diff}
            </span>
          </div>
        ))}
      </div>

      <button className={styles.shareButton} onClick={handleShare}>
        Share
      </button>
      <span className={styles.copied}>{copied ? 'Copied to clipboard!' : ''}</span>
    </div>
  );
}
