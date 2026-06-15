import { useEffect, useMemo, useState } from 'react';
import { ShareCard } from '../components/ShareCard';
import { loadGameState, loadStats } from '../engine/storage';
import { getTodaysPuzzle, getSport, getDateOverride } from '../data/puzzles';
import { getMaxPossibleScore, getScoreTierLabel } from '../engine/scoring';
import { generateShareText, shareResults, type ShareOutcome } from '../lib/share';
import { fetchMyScore } from '../lib/api';
import { Toast } from '../components/Toast';
import { RewindGlyph } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import type { RoundResult } from '../types';
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
  const [remoteState, setRemoteState] = useState<{
    totalScore: number;
    elapsedMs: number;
    results: RoundResult[];
  } | null>(null);
  const [remoteChecked, setRemoteChecked] = useState(false);
  const maxScore = getMaxPossibleScore(5);
  const dateLabel = new Date(`${getDateOverride()}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const displayState = state?.completed
    ? { totalScore: state.totalScore, elapsedMs: state.elapsedMs ?? 0, results: state.results }
    : remoteState;

  const motivationalLabel = displayState ? getScoreTierLabel(displayState.totalScore, maxScore) : '';

  useEffect(() => {
    if (state?.completed) {
      setRemoteChecked(true);
      return;
    }
    if (!isAuthenticated) return;

    let cancelled = false;
    setRemoteChecked(false);

    fetchMyScore(getDateOverride())
      .then((resp) => {
        if (cancelled) return;
        if (resp) {
          setRemoteState({
            totalScore: resp.scores,
            elapsedMs: resp.metadata.total_time * 1000,
            results: resp.metadata.rounds.map((round) => ({
              event: { text: round.event_text, year: round.actual_year },
              guessedYear: round.guessed_year,
              actualYear: round.actual_year,
              diff: round.diff,
              score: round.score,
            })),
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRemoteChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, state?.completed]);

  useEffect(() => {
    // Show the motivational toast after the card animation settles
    const showTimer = setTimeout(() => setShowMotivational(true), 600);
    const hideTimer = setTimeout(() => setShowMotivational(false), 4000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  if (!displayState) {
    if (isAuthenticated && !remoteChecked) {
      return null;
    }
    onHome();
    return null;
  }

  const handleShare = async () => {
    const text = generateShareText(
      puzzle.number,
      displayState.results,
      displayState.totalScore,
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
          results={displayState.results}
          totalScore={displayState.totalScore}
          maxScore={maxScore}
          dateLabel={dateLabel}
          elapsedMs={displayState.elapsedMs}
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
              …to see where you rank worldwide, invite group chat and more
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
    </div>
  );
}
