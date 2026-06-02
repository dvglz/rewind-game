import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { OrderingScreen } from './screens/OrderingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { loadGameState } from './engine/storage';
import { getTodayString } from './lib/date';
import { getSport } from './data/puzzles';
import './styles/global.css';

type Screen = 'home' | 'game' | 'ordering' | 'results';

export function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'ordering') return 'ordering';
    return 'home';
  });

  const navigate = (s: Screen) => {
    setScreen(s);
    const url = s === 'ordering' ? '/?mode=ordering' : '/';
    window.history.pushState({}, '', url);
  };

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          onPlay={() => {
            const sport = getSport();
            const todayState = loadGameState(`${getTodayString()}-${sport}`);
            if (todayState?.completed) {
              navigate('results');
            } else {
              navigate('game');
            }
          }}
        />
      )}
      {screen === 'game' && <GameScreen onFinish={() => navigate('results')} />}
      {screen === 'ordering' && <OrderingScreen onFinish={() => navigate('results')} />}
      {screen === 'results' && <ResultsScreen onHome={() => navigate('home')} />}
    </>
  );
}

export default App;
