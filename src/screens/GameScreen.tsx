import { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { Timeline } from '../components/Timeline';
import { ConfirmButton } from '../components/ConfirmButton';
import { useGame } from '../hooks/useGame';
import { useTimeline } from '../hooks/useTimeline';
import { getTodaysPuzzle } from '../data/puzzles';
import { getResultColor } from '../engine/scoring';
import { vibrateConfirm, vibrateError, vibrateMedium } from '../lib/haptics';
import type { RoundResult } from '../types';
import styles from './GameScreen.module.css';

interface GameScreenProps {
  onFinish: () => void;
}

export function GameScreen({ onFinish }: GameScreenProps) {
  const puzzle = getTodaysPuzzle();
  const game = useGame(puzzle);
  const timeline = useTimeline();
  const [pendingResult, setPendingResult] = useState<RoundResult | null>(null);
  const [revealResult, setRevealResult] = useState<RoundResult | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showRevealText, setShowRevealText] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const activeResult = revealResult ?? pendingResult;
  const displayRound = activeResult
    ? Math.min(game.currentRound, game.totalRounds)
    : Math.min(game.currentRound + 1, game.totalRounds);

  const handleScroll = useCallback(() => {
    timeline.handleScroll();
  }, [timeline]);

  const handleConfirm = useCallback(async () => {
    const result = game.submitGuess(timeline.selectedYear);
    if (result) {
      setPendingResult(result);
      setIsResolving(true);
      setShowRevealText(false);

      await timeline.scrollToYear(result.actualYear, true);

      const resultColor = getResultColor(result.diff);
      if (resultColor === 'correct') {
        vibrateConfirm();
      } else if (resultColor === 'close') {
        vibrateMedium();
      } else {
        vibrateError();
      }

      setRevealResult(result);
      setPendingResult(null);
      setIsResolving(false);

      revealTimer.current = setTimeout(() => {
        setShowRevealText(true);
      }, 250);
    }
  }, [game, timeline]);

  const handleNext = useCallback(() => {
    setPendingResult(null);
    setRevealResult(null);
    setIsResolving(false);
    setShowRevealText(false);
    if (revealTimer.current) clearTimeout(revealTimer.current);

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

  if (game.isComplete && !activeResult && !isResolving) {
    onFinish();
    return null;
  }

  const scoreBadgeText = revealResult
    ? revealResult.diff === 0
      ? `You're correct. ${revealResult.score} pts.`
      : `Picked ${Math.abs(revealResult.diff)} year${Math.abs(revealResult.diff) > 1 ? 's' : ''} off. ${revealResult.score} pts.`
    : '';
  const headlineYear = revealResult?.guessedYear ?? pendingResult?.guessedYear ?? timeline.selectedYear;

  const colorVar = color === 'correct'
    ? 'var(--color-correct)'
    : color === 'close'
      ? 'var(--color-close)'
      : color === 'wrong'
        ? 'var(--color-wrong)'
        : 'var(--color-text)';
  const headlineYearColor = revealResult ? colorVar : 'var(--color-text)';
  const indicatorColor = isRevealing ? 'var(--color-correct)' : undefined;

  return (
    <div className={styles.screen}>
      <Header sport={puzzle.sport} />

      <div className={styles.topSection}>
        <div className={styles.contentWidth}>
          <p className={styles.roundCounter}>
            Question {displayRound}/{game.totalRounds}
          </p>
          <div className={styles.promptShell}>
            {!!displayText && (
              <h2
                className={`${styles.question} ${activeResult ? '' : styles.questionFresh}`}
              >
                {displayText}
              </h2>
            )}

            <div className={`${styles.revealPanel} ${isRevealing ? styles.revealPanelVisible : styles.revealPanelIdle}`}>
              <>
                <span
                  className={styles.answerYear}
                  data-testid="headline-year"
                  style={{ color: headlineYearColor }}
                >
                  {headlineYear}
                </span>
                {revealResult && (
                  <div className={styles.badgeRow}>
                    <span className={styles.badgeSquare} style={{ background: colorVar }} />
                    <span className={styles.badgeText}>{scoreBadgeText}</span>
                  </div>
                )}
              </>
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
        />
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
          {isRevealing ? (
            <button
              onClick={handleNext}
              className={styles.nextButton}
            >
              {game.isComplete ? 'See results' : 'Next round'}
            </button>
          ) : !isResolving ? (
            <ConfirmButton
              onConfirm={handleConfirm}
              disabled={isLocked}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
