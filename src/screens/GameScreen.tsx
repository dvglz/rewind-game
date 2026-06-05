import { useState, useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { Confetti } from '../components/Confetti';
import { Header } from '../components/Header';
import { Timeline } from '../components/Timeline';
import { ConfirmButton } from '../components/ConfirmButton';
import { useGame } from '../hooks/useGame';
import { useTimeline } from '../hooks/useTimeline';
import { getTodaysPuzzle } from '../data/puzzles';
import { getResultColor, getResultColorVar, getResultLabel, ROUND_WEIGHTS } from '../engine/scoring';
import { vibrateConfirm, vibrateError, vibrateMedium } from '../lib/haptics';
import type { RoundResult } from '../types';
import styles from './GameScreen.module.css';

const sleep = (ms: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, ms);
});

interface GameScreenProps {
  onFinish: () => void;
  onHome?: () => void;
}

export function GameScreen({ onFinish, onHome }: GameScreenProps) {
  const puzzle = getTodaysPuzzle();
  const game = useGame(puzzle);
  const timeline = useTimeline(puzzle.events);
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
  const [displayedScore, setDisplayedScore] = useState(0);
  const [scorePopping, setScorePopping] = useState(false);
  const [showPointsToast, setShowPointsToast] = useState(false);
  const [toastScore, setToastScore] = useState(0);
  const [toastColor, setToastColor] = useState('var(--color-text)');
  const [toastTextDark, setToastTextDark] = useState(false);
  const spotlightYearRef = useRef<number | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const flashOffTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const rafRef = useRef<number | null>(null);
  const activeResult = revealResult ?? pendingResult;
  const displayRound = activeResult
    ? Math.min(game.currentRound, game.totalRounds)
    : Math.min(game.currentRound + 1, game.totalRounds);

  const handleScroll = useCallback(() => {
    timeline.handleScroll();
  }, [timeline]);

  const handleConfirm = useCallback(async () => {
    const result = game.submitGuess(timeline.selectedYear);
    if (!result) return;

    setPendingResult(result);
    setIsResolving(true);
    setShowRevealText(false);
    setBadgeVisible(false);
    setIsPerfectReveal(false);
    setShowConfetti(false);
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

    if (resultColor === 'perfect' || resultColor === 'great') {
      vibrateConfirm();
    } else if (resultColor === 'ballpark') {
      vibrateMedium();
    } else {
      vibrateError();
    }

    setRevealResult(result);
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
  }, [game, timeline, displayedScore]);

  const handleNext = useCallback(() => {
    setPendingResult(null);
    setRevealResult(null);
    setIsResolving(false);
    setShowRevealText(false);
    setBadgeVisible(false);
    setShowConfetti(false);
    setIsPerfectReveal(false);
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
  }, [game.isComplete, onFinish]);

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
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

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
        sport={puzzle.sport}
        onHome={onHome}
        gameNumber={puzzle.number}
        rightText={`${displayedScore} PTS`}
        rightLabel="Score:"
        scorePopping={scorePopping}
        onScoreAnimationEnd={() => setScorePopping(false)}
      />

      <div className={styles.topSection}>
        <div className={styles.contentWidth}>
          <p
            className={`${styles.roundCounter} ${
              micropause ? styles.micropauseDim : ''
            } ${!micropause && revealResult ? styles.micropauseRestore : ''}`}
          >
            Question {displayRound} of {game.totalRounds}
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

            <p className={styles.themeLine}>
              {!activeResult && puzzle.theme ? puzzle.theme : ''}
            </p>
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
          {isRevealing ? (
            <p className={`${styles.revealDetail} ${showRevealText ? styles.revealDetailVisible : ''}`}>
              {revealResult?.event.detail ?? ''}
            </p>
          ) : null}
        </div>
        <div className={styles.buttonRail}>
          {!isRevealing && !isResolving && (ROUND_WEIGHTS[game.currentRound] ?? 0) > 100 && (
            <p className={styles.worthLabel}>
              Worth {(ROUND_WEIGHTS[game.currentRound] ?? 0) / 100}x points
            </p>
          )}
          {isRevealing ? (
            <button
              onClick={handleNext}
              className={styles.nextButton}
            >
              {game.isComplete ? 'See Results' : 'Next Round'}
            </button>
          ) : !isResolving ? (
            <ConfirmButton
              onConfirm={handleConfirm}
              disabled={isLocked}
            />
          ) : null}
        </div>
      </div>

      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
}
