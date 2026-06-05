import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { OrderingScreen } from './screens/OrderingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { clearGameState, loadGameState, pruneOldGameStates } from './engine/storage';
import { beginPuzzleSession, getSport, getTodaysPuzzle } from './data/puzzles';
import { useWebHaptics } from 'web-haptics/react';
import { initHaptics } from './lib/haptics';
import { useThemePreference } from './hooks/useThemePreference';
import './styles/global.css';

type Screen = 'home' | 'game' | 'ordering' | 'results';

export function App() {
  const { trigger } = useWebHaptics({
    debug: typeof navigator !== 'undefined' && !('vibrate' in navigator),
  });
  useThemePreference();

  useEffect(() => {
    initHaptics(trigger);
  }, [trigger]);

  useEffect(() => {
    const puzzle = getTodaysPuzzle(getSport());
    pruneOldGameStates(puzzle.id);
  }, []);
  const [screen, setScreen] = useState<Screen>(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'ordering') return 'ordering';
    if (mode === 'game') {
      const sport = getSport();
      const puzzle = getTodaysPuzzle(sport);
      const saved = loadGameState(puzzle.id);
      if (saved && !saved.completed) return 'game';
      return 'home';
    }
    if (mode === 'results') {
      const sport = getSport();
      const puzzle = getTodaysPuzzle(sport);
      const saved = loadGameState(puzzle.id);
      if (saved && saved.completed) return 'results';
      return 'home';
    }
    return 'home';
  });

  const navigate = (s: Screen) => {
    setScreen(s);
    const params = new URLSearchParams(window.location.search);
    if (s === 'home') {
      params.delete('mode');
    } else {
      params.set('mode', s);
    }

    const nextSearch = params.toString();
    window.history.pushState({}, '', nextSearch ? `/?${nextSearch}` : '/');
  };

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          hasInProgressGame={(() => {
            const sport = getSport();
            const puzzle = getTodaysPuzzle(sport);
            const saved = loadGameState(puzzle.id);
            return !!saved && !saved.completed;
          })()}
          onPlay={() => {
            const sport = getSport();
            const puzzle = getTodaysPuzzle(sport);
            const saved = loadGameState(puzzle.id);
            if (saved && !saved.completed) {
              navigate('game');
              return;
            }
            beginPuzzleSession();
            clearGameState(puzzle.id);
            navigate('game');
          }}
          /* TODO: uncomment when done testing
          hasCompletedGame={(() => {
            const sport = getSport();
            const puzzle = getTodaysPuzzle(sport);
            const saved = loadGameState(puzzle.id);
            return !!saved && saved.completed;
          })()}
          onViewResults={() => navigate('results')}
          */
        />
      )}
      {screen === 'game' && <GameScreen onFinish={() => navigate('results')} onHome={() => navigate('home')} />}
      {screen === 'ordering' && <OrderingScreen onFinish={() => navigate('results')} />}
      {screen === 'results' && <ResultsScreen onHome={() => navigate('home')} />}
    </>
  );
}

export default App;
