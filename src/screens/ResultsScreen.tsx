import { useEffect, useMemo, useState } from 'react';
import { ShareCard } from '../components/ShareCard';
import { loadGameState, loadStats } from '../engine/storage';
import { getTodaysPuzzle, getSport, getDateOverride } from '../data/puzzles';
import { getMaxPossibleScore, getScoreTierLabel } from '../engine/scoring';
import { generateShareText, shareResults, type ShareOutcome } from '../lib/share';
import { Toast } from '../components/Toast';
import { RewindGlyph } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import styles from './ResultsScreen.module.css';

interface ResultsScreenProps {
  onHome: () => void;
  onGroups: () => void;
  onLeaderboard: () => void;
  onRequireAuth: () => void;
}

export function ResultsScreen({ onHome, onGroups, onLeaderboard, onRequireAuth }: ResultsScreenProps) {
  const { isAuthenticated } = useAuth();
  const puzzle = getTodaysPuzzle();
  const sport = getSport();
  const state = useMemo(() => loadGameState(puzzle.id), [puzzle.id]);
  const stats = useMemo(() => loadStats(), []);
  const [shareState, setShareState] = useState<ShareOutcome | null>(null);
  const [showMotivational, setShowMotivational] = useState(false);
  const maxScore = getMaxPossibleScore(5);
  const dateLabel = new Date(`${getDateOverride()}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const motivationalLabel = state ? getScoreTierLabel(state.totalScore, maxScore) : '';

  useEffect(() => {
    // Show the motivational toast after the card animation settles
    const showTimer = setTimeout(() => setShowMotivational(true), 600);
    const hideTimer = setTimeout(() => setShowMotivational(false), 4000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

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
          dateLabel={dateLabel}
          elapsedMs={state.elapsedMs}
        />

        <button
          onClick={() => void handleShare()}
          className={styles.shareButton}
          style={{ animationDelay: '620ms' }}
        >
          Share Score
        </button>

        {isAuthenticated ? (
          <>
            <button
              className={styles.secondaryButton}
              onClick={onGroups}
              type="button"
              style={{ animationDelay: '660ms' }}
            >
              See Friends&apos; Scores
            </button>
            <p className={styles.contextLine} style={{ animationDelay: '700ms' }}>
              Check today&apos;s rank worldwide in{' '}
              <button className={styles.inlineLink} onClick={onLeaderboard} type="button">
                Leaderboard
              </button>
            </p>
          </>
        ) : (
          <>
            <button
              className={styles.secondaryButton}
              onClick={onRequireAuth}
              type="button"
              style={{ animationDelay: '660ms' }}
            >
              Create an Account
            </button>
            <p className={styles.descriptionLine} style={{ animationDelay: '700ms' }}>
              …to see where you rank worldwide,
              <br />
              invite group chat and more
            </p>
            <p className={styles.contextLine} style={{ animationDelay: '740ms' }}>
              Already member?{' '}
              <button className={styles.inlineLink} onClick={onRequireAuth} type="button">
                Sign in
              </button>
            </p>
          </>
        )}

        <div className={styles.footer} style={{ animationDelay: '780ms' }}>
          <RewindGlyph className={styles.rewindGlyph} />
          <p className={styles.motivational}>
            New questions drop daily.
            <br />
            Get back tomorrow.
          </p>
        </div>
      </div>
      {showMotivational && <Toast message={motivationalLabel} />}
      {shareState === 'copied' && <Toast message="Copied to clipboard" />}
      {shareState === 'failed' && <Toast message="Copy failed" variant="error" />}
    </div>
  );
}
