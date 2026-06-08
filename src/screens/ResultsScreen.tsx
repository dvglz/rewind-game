import { useMemo, useState } from 'react';
import { ShareCard } from '../components/ShareCard';
import { loadGameState, loadStats } from '../engine/storage';
import { getTodaysPuzzle, getSport, getDateOverride } from '../data/puzzles';
import { getMaxPossibleScore } from '../engine/scoring';
import { generateShareText, shareResults, type ShareOutcome } from '../lib/share';
import { Toast } from '../components/Toast';
import styles from './ResultsScreen.module.css';

interface ResultsScreenProps {
  onHome: () => void;
  onGroups: () => void;
}

export function ResultsScreen({ onHome, onGroups }: ResultsScreenProps) {
  const puzzle = getTodaysPuzzle();
  const sport = getSport();
  const state = useMemo(() => loadGameState(puzzle.id), [puzzle.id]);
  const stats = useMemo(() => loadStats(), []);
  const [shareState, setShareState] = useState<ShareOutcome | null>(null);
  const maxScore = getMaxPossibleScore(5);

  if (!state || !state.completed) {
    onHome();
    return null;
  }

  const handleShare = async () => {
    if (!state) return;
    const text = generateShareText(
      puzzle.number,
      state.results,
      state.totalScore,
      maxScore,
      stats.currentStreak,
      sport,
      getDateOverride(),
    );
    const outcome = await shareResults(text);
    setShareState(outcome);
    if (outcome !== 'failed') {
      setTimeout(() => setShareState(null), 2000);
    }
  };

  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <span className={styles.topBarSpacer} />
        <button type="button" className={styles.wordmarkButton} onClick={onHome}>
          <span className={styles.wordmark}>REWIND</span>
        </button>
        <span className={styles.topBarSpacer} />
      </header>
      <div className={styles.content}>
        <ShareCard
          results={state.results}
          totalScore={state.totalScore}
          maxScore={maxScore}
        />

        <button
          onClick={() => void handleShare()}
          className={styles.shareButton}
          style={{ animationDelay: '620ms' }}
        >
          Share Score
        </button>

        <div className={styles.groupCta} style={{ animationDelay: '660ms' }}>
          <button className={styles.friendsButton} onClick={onGroups} type="button">
            See Friends&apos; Scores
          </button>
        </div>

        <p className={styles.motivational} style={{ animationDelay: '700ms' }}>
          New questions at Pacific midnight.
          <br />
          Get back tomorrow.
        </p>

      </div>
      {shareState === 'copied' && <Toast message="Copied to clipboard" />}
      {shareState === 'failed' && <Toast message="Copy failed" variant="error" />}
    </div>
  );
}
