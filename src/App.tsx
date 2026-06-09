import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { OrderingScreen } from './screens/OrderingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { GroupsScreen } from './screens/GroupsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { clearGameState, loadGameState, pruneOldGameStates } from './engine/storage';
import { beginPuzzleSession, getSport, getTodaysPuzzle } from './data/puzzles';
import { useWebHaptics } from 'web-haptics/react';
import { initHaptics } from './lib/haptics';
import { hidesCompletedGameLock, shouldEnableHapticsDebug } from './lib/testMode';
import { useThemePreference } from './hooks/useThemePreference';
import { setAccessToken } from './lib/auth';
import './styles/global.css';

type Screen = 'home' | 'game' | 'ordering' | 'results' | 'groups' | 'auth';

function AppInner() {
  const allowReplay = hidesCompletedGameLock(window.location.search);
  const hasVibrateSupport = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  const { trigger } = useWebHaptics({
    debug: shouldEnableHapticsDebug(window.location.search, hasVibrateSupport),
  });
  const { isAuthenticated } = useAuth();
  useThemePreference();

  useEffect(() => {
    initHaptics(trigger);
  }, [trigger]);

  useEffect(() => {
    const puzzle = getTodaysPuzzle(getSport());
    pruneOldGameStates(puzzle.id);
  }, []);

  // Handle email magic-link callback: extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && params.get('mode') === 'auth') {
      setAccessToken(token);
      // Clean token from URL and reload to let AuthProvider pick it up
      params.delete('token');
      const nextSearch = params.toString();
      window.location.replace(nextSearch ? `/?${nextSearch}` : '/');
    }
  }, []);

  const [screen, setScreen] = useState<Screen>(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'auth') return 'auth';
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
      if (saved && saved.completed && !allowReplay) return 'results';
      return 'home';
    }
    return 'home';
  });

  const navigate = (s: Screen) => {
    setScreen(s);
    const params = new URLSearchParams(window.location.search);
    if (s === 'home') {
      params.delete('mode');
      params.delete('returnTo');
    } else {
      params.set('mode', s);
    }
    // Preserve returnTo only for auth screen
    if (s !== 'auth') {
      params.delete('returnTo');
    }

    const nextSearch = params.toString();
    window.history.pushState({}, '', nextSearch ? `/?${nextSearch}` : '/');
  };

  const navigateToAuth = (returnTo: Screen) => {
    const params = new URLSearchParams(window.location.search);
    params.set('mode', 'auth');
    params.set('returnTo', returnTo);
    const nextSearch = params.toString();
    window.history.pushState({}, '', `/?${nextSearch}`);
    setScreen('auth');
  };

  const getReturnTo = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get('returnTo');
  };

  const handleAuthSuccess = () => {
    const returnTo = getReturnTo();
    if (returnTo && ['home', 'game', 'ordering', 'results', 'groups'].includes(returnTo)) {
      navigate(returnTo as Screen);
    } else {
      navigate('home');
    }
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
          hasCompletedGame={(() => {
            const sport = getSport();
            const puzzle = getTodaysPuzzle(sport);
            const saved = loadGameState(puzzle.id);
            return !!saved && saved.completed && !allowReplay;
          })()}
          onViewResults={() => navigate('results')}
          showDebugTools={allowReplay}
          onGroups={() => navigate('groups')}
        />
      )}
      {screen === 'game' && <GameScreen onFinish={() => navigate('results')} onHome={() => navigate('home')} />}
      {screen === 'ordering' && <OrderingScreen onFinish={() => navigate('results')} />}
      {screen === 'results' && <ResultsScreen onHome={() => navigate('home')} onGroups={() => navigate('groups')} />}
      {screen === 'groups' && (
        <GroupsScreen
          onBack={() => navigate('home')}
          onRequireAuth={() => navigateToAuth('groups')}
          isAuthenticated={isAuthenticated}
        />
      )}
      {screen === 'auth' && (
        <AuthScreen
          onBack={() => navigate('home')}
          onSuccess={handleAuthSuccess}
          returnTo={getReturnTo()}
        />
      )}
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
