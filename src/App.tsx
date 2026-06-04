import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { OrderingScreen } from './screens/OrderingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { clearGameState } from './engine/storage';
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
  const [screen, setScreen] = useState<Screen>(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'ordering') return 'ordering';
    return 'home';
  });

  const navigate = (s: Screen) => {
    setScreen(s);
    const params = new URLSearchParams(window.location.search);
    if (s === 'ordering') {
      params.set('mode', 'ordering');
    } else {
      params.delete('mode');
    }

    const nextSearch = params.toString();
    window.history.pushState({}, '', nextSearch ? `/?${nextSearch}` : '/');
  };

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          onPlay={() => {
            const sport = getSport();
            beginPuzzleSession();
            const puzzle = getTodaysPuzzle(sport);
            clearGameState(puzzle.id);
            navigate('game');
          }}
        />
      )}
      {screen === 'game' && <GameScreen onFinish={() => navigate('results')} onHome={() => navigate('home')} />}
      {screen === 'ordering' && <OrderingScreen onFinish={() => navigate('results')} />}
      {screen === 'results' && <ResultsScreen onHome={() => navigate('home')} />}
    </>
  );
}

export default App;
