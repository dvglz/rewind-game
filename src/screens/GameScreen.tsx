import { useState, useCallback } from 'react';
import { Header } from '../components/Header';
import { Timeline } from '../components/Timeline';
import { ConfirmButton } from '../components/ConfirmButton';
import { RoundResult } from '../components/RoundResult';
import { useGame } from '../hooks/useGame';
import { getTodaysPuzzle } from '../data/puzzles';
import type { RoundResult as RoundResultType } from '../types';

interface GameScreenProps {
  onFinish: () => void;
}

export function GameScreen({ onFinish }: GameScreenProps) {
  const puzzle = getTodaysPuzzle();
  const game = useGame(puzzle);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showResult, setShowResult] = useState<RoundResultType | null>(null);

  const handleConfirm = useCallback(() => {
    const result = game.submitGuess(selectedYear);
    if (result) {
      setShowResult(result);
    }
  }, [game, selectedYear]);

  const handleNext = useCallback(() => {
    setShowResult(null);
    if (game.isComplete) {
      onFinish();
    }
  }, [game.isComplete, onFinish]);

  if (game.isComplete && !showResult) {
    onFinish();
    return null;
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{
        flex: '0 0 auto',
        textAlign: 'center',
        padding: '0 24px',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          marginBottom: '8px',
        }}>
          {game.currentRound + 1}/{game.totalRounds}
        </p>
        {game.currentEvent && (
          <h2 style={{
            fontFamily: 'var(--font-body)',
            fontSize: '22px',
            fontWeight: 400,
            lineHeight: 1.4,
          }}>
            {game.currentEvent.text}
          </h2>
        )}

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '16px',
          color: 'var(--color-muted)',
          marginTop: '16px',
          minHeight: '24px',
        }}>
          {puzzle.theme && `${puzzle.theme}`}
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
        <Timeline
          onYearChange={setSelectedYear}
          disabled={showResult !== null}
        />
      </div>

      <ConfirmButton
        selectedYear={selectedYear}
        onConfirm={handleConfirm}
        disabled={showResult !== null}
      />

      {showResult && (
        <RoundResult
          result={showResult}
          onNext={handleNext}
          isLast={game.currentRound >= game.totalRounds}
        />
      )}
    </div>
  );
}
