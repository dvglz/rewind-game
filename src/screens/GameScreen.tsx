import { useState, useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { Confetti } from '../components/Confetti';
import { Header } from '../components/Header';
import { RulesSheet } from '../components/RulesSheet';
import { Timeline } from '../components/Timeline';
import { ConfirmButton } from '../components/ConfirmButton';
import { MediaRevealCard } from '../components/MediaRevealCard';
import { useGame } from '../hooks/useGame';
import { useTimeline } from '../hooks/useTimeline';
import { useElapsedTimer } from '../hooks/useElapsedTimer';
import { formatTime } from '../lib/formatTime';
import { getTodaysPuzzle, isRewindLabMode, isPracticeMode } from '../data/puzzles';
import { getResultColor, getResultColorVar, getResultLabel, getMaxPossibleScore, ROUND_WEIGHTS } from '../engine/scoring';
import { vibrateConfirm, vibrateError, vibrateMedium } from '../lib/haptics';
import { loadStats } from '../engine/storage';
import { getAccessToken } from '../lib/auth';
import { track } from '../lib/analytics';
import type { RoundResult, SpecialEventMedia } from '../types';
import styles from './GameScreen.module.css';

const sleep = (ms: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, ms);
});

// Print-photo tilt per round — deterministic so a resumed game shows the same angles.
const MEDIA_TILTS = [-3, 2.5, -2, 3, -2.5, 2, -3.2, 2.8, -2.2, 3.4] as const;

interface GameScreenProps {
  onFinish: () => void;
  onHome?: () => void;
}

export function GameScreen({ onFinish, onHome }: GameScreenProps) {
  const puzzle = getTodaysPuzzle();
  const game = useGame(puzzle, { scoringEnabled: !isRewindLabMode() && !isPracticeMode() });
  const timeline = useTimeline(puzzle.events);
  const weights = puzzle.weights ?? ROUND_WEIGHTS;
  // Capture the game's start once so the timer base is stable across renders.
  // startedAt is set at game creation; the fallback only covers legacy saves.
  const [timerStart] = useState(() => game.state.startedAt ?? Date.now());
  const [mediaCard, setMediaCard] = useState<SpecialEventMedia | null>(null);
  const elapsedMs = useElapsedTimer(
    game.state.startedAt ?? timerStart,
    game.isComplete,
    game.state.pausedMs ?? 0,
    mediaCard !== null && !game.isComplete,
  );
  const [rulesOpen, setRulesOpen] = useState(false);
  // Rounds whose answer has been revealed — dots color at reveal, not on lock.
  const [revealedRounds, setRevealedRounds] = useState(() => game.results.length);
  const [animatedDoneIndex, setAnimatedDoneIndex] = useState<number | undefined>();
  const [pendingResult, setPendingResult] = useState<RoundResult | null>(null);
  const [revealResult, setRevealResult] = useState<RoundResult | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showRevealText, setShowRevealText] = useState(false);
  const [spotlightCenter, setSpotlightCenter] = useState<number | null>(null);
  const [spotlightActive, setSpotlightActive] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [flashState, setFlashState] = useState<'off' | 'on' | 'fading'>('off');
  const [micropause, setMicropause] = useState(false);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPerfectReveal, setIsPerfectReveal] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(game.totalScore);
  const [scorePopping, setScorePopping] = useState(false);
  const [showPointsToast, setShowPointsToast] = useState(false);
  const [toastScore, setToastScore] = useState(0);
  const [toastColor, setToastColor] = useState('var(--color-text)');
  const [toastTextDark, setToastTextDark] = useState(false);
  const spotlightYearRef = useRef<number | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const flashOffTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const mediaTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const mediaOpenedAt = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const completeFired = useRef(false);
  const activeResult = revealResult ?? pendingResult;
  const displayRound = activeResult
    ? Math.min(game.currentRound, game.totalRounds)
    : Math.min(game.currentRound + 1, game.totalRounds);

  const handleScroll = useCallback(() => {
    timeline.handleScroll();
  }, [timeline]);

  const handleConfirm = useCallback(async () => {
    const roundNumber = game.results.length + 1;
    const result = game.submitGuess(timeline.selectedYear);
    if (!result) return;

    track('round_complete', {
      game_number: puzzle.number,
      round_number: roundNumber,
      diff: result.diff,
      round_score: result.score,
    });

    setPendingResult(result);
    setIsResolving(true);
    setShowRevealText(false);
    setBadgeVisible(false);
    setIsPerfectReveal(false);
    setShowConfetti(false);
    setAnimatedDoneIndex(undefined);
    spotlightYearRef.current = null;

    const resultColor = getResultColor(result.diff);
    const resultColorVar = getResultColorVar(resultColor);
    const isPerfect = result.diff === 0;

    setMicropause(true);
    await sleep(280);

    if (isPerfect) {
      setShowConfetti(true);
    } else {
      setSpotlightCenter(timeline.selectedYear);
      setSpotlightActive(true);
      await timeline.scrollToYear(
        result.actualYear,
        true,
        false,
        (centerX: number) => {
          const spacer = timeline.containerRef.current
            ? timeline.containerRef.current.clientWidth / 2
            : 0;
          const posInTrack = centerX - spacer;
          const yearFloat = (posInTrack - timeline.yearWidth / 2) / timeline.yearWidth + timeline.rangeStart;
          const year = Math.round(yearFloat);
          if (spotlightYearRef.current !== year) {
            spotlightYearRef.current = year;
            setSpotlightCenter(year);
          }
        },
      );
    }

    setFlashColor(resultColorVar);
    setFlashState('on');
    flashTimer.current = setTimeout(() => {
      setFlashState('fading');
    }, isPerfect ? 150 : 120);
    flashOffTimer.current = setTimeout(() => {
      setFlashState('off');
    }, isPerfect ? 650 : 520);

    if (resultColor === 'perfect') {
      vibrateConfirm();
    } else if (resultColor === 'ballpark') {
      vibrateMedium();
    } else {
      vibrateError();
    }

    setRevealResult(result);
    setRevealedRounds(roundNumber);
    setAnimatedDoneIndex(roundNumber - 1);
    setPendingResult(null);
    setIsResolving(false);
    setSpotlightActive(false);
    setSpotlightCenter(null);
    spotlightYearRef.current = null;
    setMicropause(false);

    setToastScore(result.score);
    setToastColor(resultColorVar);
    setToastTextDark(resultColor === 'ballpark');
    setShowPointsToast(true);

    // Count up displayedScore to new totalScore
    const startScore = displayedScore;
    const endScore = game.totalScore + result.score;
    const duration = 400;
    const startTime = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      setDisplayedScore(Math.round(startScore + (endScore - startScore) * t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setScorePopping(true);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    if (isPerfect) {
      setIsPerfectReveal(true);
    }

    await sleep(150);
    setBadgeVisible(true);

    revealTimer.current = setTimeout(() => {
      setShowRevealText(true);
    }, 250);

    if (result.event.media) {
      mediaTimer.current = setTimeout(() => {
        setMediaCard(result.event.media ?? null);
        mediaOpenedAt.current = Date.now();
      }, 600); // overlay pops once the timeline has landed; photo/text stagger via CSS
    }
  }, [game, timeline, displayedScore, puzzle.number]);

  const handleNext = useCallback(() => {
    if (mediaOpenedAt.current !== null) {
      game.recordPause(Date.now() - mediaOpenedAt.current);
      mediaOpenedAt.current = null;
    }
    setMediaCard(null);
    if (mediaTimer.current) clearTimeout(mediaTimer.current);
    mediaTimer.current = null;

    setPendingResult(null);
    setRevealResult(null);
    setIsResolving(false);
    setShowRevealText(false);
    setBadgeVisible(false);
    setShowConfetti(false);
    setIsPerfectReveal(false);
    setAnimatedDoneIndex(undefined);
    setMicropause(false);
    setFlashState('off');
    setShowPointsToast(false);
    setFlashColor(null);
    setSpotlightActive(false);
    setSpotlightCenter(null);
    spotlightYearRef.current = null;
    if (revealTimer.current) clearTimeout(revealTimer.current);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    if (flashOffTimer.current) clearTimeout(flashOffTimer.current);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    if (game.isComplete) {
      onFinish();
    }
  }, [game, onFinish]);

  const isRevealing = revealResult !== null;
  const isLocked = isRevealing || isResolving;
  const displayText = activeResult?.event.text ?? game.currentEvent?.text ?? '';
  const color = revealResult ? getResultColor(revealResult.diff) : null;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !isRevealing) return;
      const target = event.target as HTMLElement | null;
      if (target && /input|textarea|select|button/i.test(target.tagName)) return;
      event.preventDefault();
      handleNext();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRevealing, handleNext]);

  useEffect(() => () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    if (flashOffTimer.current) clearTimeout(flashOffTimer.current);
    if (mediaTimer.current) clearTimeout(mediaTimer.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    for (const offset of [0, 1]) {
      const src = puzzle.events[game.currentRound + offset]?.media?.src;
      if (src) new Image().src = src;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentRound]);

  useEffect(() => {
    const entry = game.results.length > 0 && !game.isComplete ? 'resume' : 'new';
    track('game_start', {
      game_number: puzzle.number,
      sport: puzzle.sport,
      is_authenticated: Boolean(getAccessToken()),
      entry_point: entry,
      ...(puzzle.special ? { special: puzzle.special.slug } : {}),
    });

    const stats = loadStats();
    if (stats.lastPlayedDate) {
      const days = Math.floor(
        (Date.now() - new Date(stats.lastPlayedDate).getTime()) / 86_400_000,
      );
      if (days >= 1) {
        track('return_play', { days_since_last: days, streak: stats.currentStreak });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (game.isComplete && !completeFired.current) {
      completeFired.current = true;
      const stats = loadStats();
      track('game_complete', {
        game_number: puzzle.number,
        sport: puzzle.sport,
        total_score: game.totalScore,
        max_score: getMaxPossibleScore(game.totalRounds, puzzle.weights),
        elapsed_ms: game.state.elapsedMs ?? 0,
        streak: stats.currentStreak,
        ...(puzzle.special ? { special: puzzle.special.slug } : {}),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.isComplete]);

  if (game.isComplete && !activeResult && !isResolving) {
    onFinish();
    return null;
  }

  const scoreBadgeText = revealResult
    ? revealResult.diff === 0
      ? getResultLabel(color!)
      : `${getResultLabel(color!)} · ${Math.abs(revealResult.diff)} ${Math.abs(revealResult.diff) === 1 ? 'YEAR' : 'YEARS'} ${revealResult.diff < 0 ? 'EARLY' : 'LATE'}`
    : '';
  const headlineYear = revealResult?.guessedYear ?? pendingResult?.guessedYear ?? timeline.selectedYear;

  const colorVar = color ? getResultColorVar(color) : 'var(--color-text)';
  const headlineYearColor = isResolving
    ? 'var(--color-text)'
    : revealResult
      ? colorVar
      : 'var(--color-text)';
  const indicatorColor = isResolving
    ? 'var(--color-text)'
    : isRevealing
      ? 'var(--color-correct)'
      : undefined;

  return (
    <div className={styles.screen}>
      {flashState !== 'off' && (
        <div
          className={`${styles.flashOverlay} ${
            flashState === 'on'
              ? isPerfectReveal || (pendingResult && pendingResult.diff === 0)
                ? styles.flashOverlayPerfect
                : styles.flashOverlayVisible
              : styles.flashOverlayFading
          }`}
          style={{ '--flash-color': flashColor ?? 'transparent' } as CSSProperties}
        />
      )}
      <Header
        onHome={onHome}
        gameNumber={puzzle.number}
        specialFlag={puzzle.special?.flag}
        rightText={`${displayedScore} PTS`}
        scorePopping={scorePopping}
        onScoreAnimationEnd={() => setScorePopping(false)}
        timerText={formatTime(elapsedMs)}
        roundState={{
          results: game.results.slice(0, revealedRounds),
          // Only pulse the active round; while viewing a revealed answer, no dot is "current".
          currentRound: revealResult ? -1 : revealedRounds,
          totalRounds: game.totalRounds,
          animatedDoneIndex,
        }}
      />
      {rulesOpen && <RulesSheet onClose={() => setRulesOpen(false)} />}

      <div className={styles.topSection}>
        <div className={styles.contentWidth}>
          <p
            className={`${styles.roundCounter} ${
              micropause ? styles.micropauseDim : ''
            } ${!micropause && revealResult ? styles.micropauseRestore : ''}`}
          >
            Round {displayRound} of {game.totalRounds}
          </p>
          <div className={styles.promptShell}>
            {!!displayText && (
              <h2
                className={`${styles.question} ${activeResult ? '' : styles.questionFresh} ${
                  micropause ? styles.micropauseDim : ''
                } ${!micropause && revealResult ? styles.micropauseRestore : ''}`}
              >
                {displayText}
              </h2>
            )}

            <div className={`${styles.revealPanel} ${isRevealing ? styles.revealPanelVisible : styles.revealPanelIdle}`}>
              <div className={isPerfectReveal ? `${styles.yearWrap} ${styles.yearPop}` : styles.yearWrap}>
                <span
                  className={`${styles.answerYear} ${
                    micropause ? styles.micropauseDim : ''
                  } ${!micropause && revealResult ? styles.micropauseRestore : ''} ${
                    isPerfectReveal ? styles.yearShimmer : ''
                  }`}
                  data-testid="headline-year"
                  style={!isPerfectReveal ? { color: headlineYearColor } : undefined}
                >
                  {headlineYear}
                </span>
              </div>
              {revealResult && (
                <div className={`${styles.badgeRow} ${badgeVisible ? styles.badgeSlideUp : ''}`}>
                  <span className={styles.badgeDot} style={{ background: colorVar }} aria-hidden="true" />
                  <span className={styles.badgeText}>{scoreBadgeText}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.timelineRegion}>
      <Timeline
        containerRef={timeline.containerRef}
        rangeStart={timeline.rangeStart}
        rangeEnd={timeline.rangeEnd}
        yearWidth={timeline.yearWidth}
        onScroll={handleScroll}
        onDragEndSnap={() => {
          void timeline.snapToClosestYear();
        }}
        disabled={isLocked}
        revealedYear={revealResult?.actualYear ?? null}
        indicatorColor={indicatorColor}
        spotlightCenter={spotlightCenter}
        spotlightActive={spotlightActive}
        />
        {showPointsToast && (
          <span
            className={styles.pointsToast}
            style={{ background: toastColor, color: toastTextDark ? '#000' : '#fff' }}
            onAnimationEnd={() => setShowPointsToast(false)}
          >
            +{toastScore} PTS
          </span>
        )}
      </div>

      <div className={styles.footerSlot}>
        <div className={styles.detailSlot}>
          {isRevealing && !revealResult?.event.media ? (
            <p className={`${styles.revealDetail} ${showRevealText ? styles.revealDetailVisible : ''}`}>
              {revealResult?.event.detail ?? ''}
            </p>
          ) : null}
        </div>
        <div className={styles.buttonRail}>
          {!isRevealing && !isResolving && (weights[game.currentRound] ?? 0) > 100 && (
            <p className={styles.worthLabel}>
              Worth {(weights[game.currentRound] ?? 0) / 100}x points
            </p>
          )}
          {isRevealing ? (
            // Media rounds advance only via the overlay's button — never show
            // the footer button, even in the beat before the overlay mounts.
            !revealResult?.event.media && (
              <button
                onClick={handleNext}
                className={styles.nextButton}
              >
                {game.isComplete ? 'See Results' : 'Next Round'}
              </button>
            )
          ) : !isResolving ? (
            <ConfirmButton
              onConfirm={handleConfirm}
              disabled={isLocked}
            />
          ) : null}
        </div>
      </div>

      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      {mediaCard && (
        <MediaRevealCard
          media={mediaCard}
          detail={revealResult?.event.detail ?? ''}
          tilt={MEDIA_TILTS[(displayRound - 1) % MEDIA_TILTS.length]}
          buttonLabel={game.isComplete ? 'See Results' : 'Next Round'}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
