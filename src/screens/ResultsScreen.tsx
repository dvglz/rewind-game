import { useEffect, useMemo, useState } from 'react';
import { ShareCard } from '../components/ShareCard';
import { JoinRewindCard } from '../components/JoinRewindCard';
import { loadGameState, loadStats, hasSeenGrade, markGradeSeen } from '../engine/storage';
import { getTodaysPuzzle, getSport, getDateOverride, isPracticeMode } from '../data/puzzles';
import { getMaxPossibleScore, getScoreTierLabel } from '../engine/scoring';
import { generateShareText, shareResults, type ShareOutcome } from '../lib/share';
import { fetchMyScore, isScoreSuperseded } from '../lib/api';
import { Toast } from '../components/Toast';
import { ResultsCountdownReminder } from '../components/ResultsCountdownReminder';
import { useAuth } from '../context/AuthContext';
import { isAppMode } from '../lib/appMode';
import { track } from '../lib/analytics';
import type { RoundResult } from '../types';
import styles from './ResultsScreen.module.css';

type AuthReason = 'default' | 'reminder';

interface ResultsScreenProps {
  onHome: () => void;
  onGroups: () => void;
  onLeaderboard: () => void;
  onRequireAuth: (reason?: AuthReason) => void;
  onArchive?: () => void;
  onBackToArchive?: () => void;
  onPlayAgain?: () => void;
}

export function ResultsScreen({ onHome, onGroups, onLeaderboard, onRequireAuth, onArchive, onBackToArchive, onPlayAgain }: ResultsScreenProps) {
  const { isAuthenticated } = useAuth();
  const appMode = isAppMode();
  const puzzle = getTodaysPuzzle();
  const sport = getSport();
  const practice = isPracticeMode();
  const state = useMemo(() => loadGameState(puzzle.id), [puzzle.id]);
  const stats = useMemo(() => loadStats(), []);
  const superseded = useMemo(() => isScoreSuperseded(puzzle.id), [puzzle.id]);
  const [shareState, setShareState] = useState<ShareOutcome | null>(null);
  const [showMotivational, setShowMotivational] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
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

  const preferLocal = Boolean(state?.completed) && !superseded;
  const displayState = preferLocal
    ? { totalScore: state!.totalScore, elapsedMs: state!.elapsedMs ?? 0, results: state!.results }
    : remoteState;

  const motivationalLabel = displayState ? getScoreTierLabel(displayState.totalScore, maxScore) : '';
  const hasScore = Boolean(displayState);

  useEffect(() => {
    if (practice) {
      setRemoteState(null);
      setRemoteChecked(true);
      return;
    }
    if (state?.completed && !superseded) {
      setRemoteState(null);
      setRemoteChecked(true);
      return;
    }
    if (!isAuthenticated) {
      setRemoteState(null);
      setRemoteChecked(false);
      return;
    }

    let cancelled = false;
    setRemoteState(null);
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
        } else {
          setRemoteState(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRemoteChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [practice, isAuthenticated, state?.completed, superseded]);

  useEffect(() => {
    // Show the score-grade toast once per puzzle/day, after the card settles.
    if (!hasScore || hasSeenGrade(puzzle.id)) return;
    const showTimer = setTimeout(() => {
      setShowMotivational(true);
      markGradeSeen(puzzle.id);
    }, 600);
    const hideTimer = setTimeout(() => setShowMotivational(false), 4000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [puzzle.id, hasScore]);

  useEffect(() => {
    if (!superseded) return;
    const show = setTimeout(() => setShowInfo(true), 100);
    const hide = setTimeout(() => setShowInfo(false), 4000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [superseded]);

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
      practice,
      displayState.elapsedMs,
    );
    const outcome = await shareResults(text);
    track('share_score', {
      method: outcome === 'shared' ? 'web_share' : 'clipboard',
      outcome,
      game_number: puzzle.number,
    });
    setShareState(outcome);
    if (outcome !== 'failed') {
      setTimeout(() => setShareState(null), 2000);
    }
  };

  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <span className={styles.topBarSpacer} />
        <button className={`${styles.wordmark} ${styles.wordmarkAction}`} onClick={onHome} type="button">
          REWIND
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
          section="summary"
        />

        {!practice && (
          <button
            onClick={() => void handleShare()}
            className={styles.shareButton}
            style={{ animationDelay: '620ms' }}
          >
            Challenge a Friend
          </button>
        )}

        {practice ? (
          <>
            <button
              className={styles.shareButton}
              onClick={onPlayAgain}
              type="button"
              style={{ animationDelay: '620ms' }}
            >
              Play Again
            </button>
            <button
              className={styles.secondaryButton}
              onClick={onBackToArchive}
              type="button"
              style={{ animationDelay: '660ms' }}
            >
              Back to Archive
            </button>
            <p className={styles.practiceNote} style={{ animationDelay: '700ms' }}>
              Practice run — scores aren’t saved.
            </p>
            {!isAuthenticated && !appMode && (
              <div className={styles.joinRewindBlock} style={{ animationDelay: '740ms' }}>
                <JoinRewindCard onSignIn={() => onRequireAuth()} />
              </div>
            )}
          </>
        ) : (isAuthenticated || appMode) ? (
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
          <button
            className={styles.secondaryButton}
            onClick={() => onArchive?.()}
            type="button"
            style={{ animationDelay: '660ms' }}
          >
            Play Past Days
          </button>
        )}

        {!practice && !isAuthenticated && !appMode && (
          <>
            <p className={styles.unlockLine} style={{ animationDelay: '700ms' }}>
              See your{' '}
              <button type="button" className={styles.unlockTerm} onClick={onGroups}>
                Group score
              </button>{' '}
              and{' '}
              <button type="button" className={styles.unlockTerm} onClick={onLeaderboard}>
                Global Rank
              </button>
            </p>
            <div className={styles.joinRewindBlock} style={{ animationDelay: '740ms' }}>
              <JoinRewindCard onSignIn={() => onRequireAuth()} />
            </div>
          </>
        )}

        <ShareCard
          results={displayState.results}
          totalScore={displayState.totalScore}
          maxScore={maxScore}
          section="breakdown"
          rowDelayBase={780}
        />
      </div>
      {!practice && !appMode && (
        <ResultsCountdownReminder
          showNotifyCta={!isAuthenticated}
          onNotify={() => {
            track('notify_me_click', {
              game_number: puzzle.number,
              is_authenticated: false,
            });
            onRequireAuth('reminder');
          }}
        />
      )}
      {showMotivational && <Toast message={motivationalLabel} />}
      {shareState === 'copied' && <Toast message="Copied to clipboard" />}
      {superseded && showInfo && <Toast message="Showing your score from earlier today" />}
    </div>
  );
}
