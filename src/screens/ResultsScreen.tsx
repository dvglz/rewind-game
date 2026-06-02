import { useMemo } from 'react';
import { Header } from '../components/Header';
import { ShareCard } from '../components/ShareCard';
import { loadGameState, loadStats } from '../engine/storage';
import { getTodaysPuzzle } from '../data/puzzles';
import { getTodayString } from '../lib/date';

interface ResultsScreenProps {
  onHome: () => void;
}

export function ResultsScreen({ onHome }: ResultsScreenProps) {
  const puzzle = getTodaysPuzzle();
  const state = useMemo(() => loadGameState(getTodayString()), []);
  const stats = useMemo(() => loadStats(), []);

  if (!state || !state.completed) {
    onHome();
    return null;
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <Header />
      <div style={{ padding: '24px', width: '100%', maxWidth: '400px' }}>
        <ShareCard
          puzzleNumber={puzzle.number}
          results={state.results}
          totalScore={state.totalScore}
          stats={stats}
        />

        <button
          onClick={onHome}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '16px',
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            border: '2px solid var(--color-border)',
            background: 'transparent',
            borderRadius: '999px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Home
        </button>
      </div>
    </div>
  );
}
