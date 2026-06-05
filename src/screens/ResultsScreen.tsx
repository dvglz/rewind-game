import { useMemo, useState } from 'react';
import { ShareCard } from '../components/ShareCard';
import { loadGameState, loadStats } from '../engine/storage';
import { getTodaysPuzzle, getSport, getDateOverride } from '../data/puzzles';
import { getMaxPossibleScore } from '../engine/scoring';
import { generateShareText, shareResults, type ShareOutcome } from '../lib/share';
import styles from './ResultsScreen.module.css';

interface ResultsScreenProps {
  onHome: () => void;
}

export function ResultsScreen({ onHome }: ResultsScreenProps) {
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

  const otherSport = sport === 'american' ? 'soccer' : 'american';
  const otherPuzzle = getTodaysPuzzle(otherSport);
  const rawTeaser = otherPuzzle.events[0]?.text ?? '';
  const teaserEvent = rawTeaser.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}️‍]+\s*/u, '');
  const crossPromoText = sport === 'american'
    ? `⚽ ${teaserEvent}. What year?`
    : `${teaserEvent}. What year?`;

  const crossPromoUrl = (() => {
    const params = new URLSearchParams(window.location.search);
    params.set('sport', otherSport);
    params.delete('mode');
    return `${window.location.pathname}?${params.toString()}`;
  })();

  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <span className={styles.wordmark}>REWIND</span>
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

        <p className={styles.motivational} style={{ animationDelay: '700ms' }}>
          New questions at Pacific midnight.
          <br />
          Get back tomorrow.
        </p>

        <a
          href={crossPromoUrl}
          className={styles.crossPromo}
          style={{ animationDelay: '800ms' }}
        >
          {crossPromoText}
        </a>
      </div>
      {shareState === 'copied' && (
        <div className={styles.shareToast}>Copied to clipboard</div>
      )}
      {shareState === 'failed' && (
        <div className={`${styles.shareToast} ${styles.shareToastError}`}>Copy failed</div>
      )}
    </div>
  );
}
