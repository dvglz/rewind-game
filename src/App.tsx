import { useState, useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { OrderingScreen } from './screens/OrderingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { GroupsScreen } from './screens/GroupsScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { ArchiveScreen } from './screens/ArchiveScreen';
import { AuthScreen } from './screens/AuthScreen';
import { HowToScreen, type HowToEntryPoint } from './screens/HowToScreen';
import { Toast } from './components/Toast';
import { ToastRegion } from './components/ToastRegion';
import { clearGameState, loadGameState, pruneOldGameStates, hasUsedArchiveFreePlay, markArchiveFreePlayUsed } from './engine/storage';
import { beginPuzzleSession, getDateOverride, getSport, getTodaysPuzzle, isRewindLabMode, isPracticeMode } from './data/puzzles';
import { useWebHaptics } from 'web-haptics/react';
import { initHaptics } from './lib/haptics';
import { hidesCompletedGameLock, shouldEnableHapticsDebug } from './lib/testMode';
import { isAppMode, ensureAppModeParam } from './lib/appMode';
import { useThemePreference } from './hooks/useThemePreference';
import { fetchMyScore, flushPendingScore } from './lib/api';
import { initAnalytics, track } from './lib/analytics';
import { archiveGateAction } from './lib/archiveGate';
import { buildTo, screenFromPathname, type Screen } from './lib/navigation';
import { markHomeIntroSeen } from './lib/homeIntro';
import { LoadingOverlay } from './components/LoadingOverlay';
import '@fontsource/special-gothic-condensed-one/latin-400.css';
import '@fontsource/lora/latin-400.css';
import '@fontsource/lora/latin-400-italic.css';
import '@fontsource/lora/latin-700.css';
import '@fontsource/lora/latin-700-italic.css';
import './styles/global.css';

// In mock mode (local dev) the auth gate is bypassed so screens that normally
// require a token — e.g. the global leaderboard — can be tested without one.
const USE_MOCK = import.meta.env.VITE_MOCK_API === 'true';
const REMINDER_AUTH_MESSAGE = "Drop your email and we'll ping you when tomorrow's puzzle drops. No password, no spam.";

export function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const screen: Screen = screenFromPathname(location.pathname);

  // Central navigation: push a path, carrying context query via buildTo.
  const go = (s: Screen) => {
    const { pathname, search } = buildTo(s, location.search);
    navigate(`${pathname}${search}`);
  };

  const allowReplay = hidesCompletedGameLock(window.location.search);
  const appMode = isAppMode();
  const hasVibrateSupport = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  const { trigger } = useWebHaptics({
    debug: shouldEnableHapticsDebug(window.location.search, hasVibrateSupport),
  });
  const { isAuthenticated, loading: isAuthLoading } = useAuth();
  useThemePreference();
  const [remoteCompleted, setRemoteCompleted] = useState(false);
  const [authToast, setAuthToast] = useState('');

  useEffect(() => {
    initHaptics(trigger);
  }, [trigger]);

  useEffect(() => {
    ensureAppModeParam();
  }, []);

  useEffect(() => {
    const puzzle = getTodaysPuzzle(getSport());
    pruneOldGameStates(puzzle.id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setRemoteCompleted(false);
      return;
    }
    if (isRewindLabMode() || isPracticeMode()) {
      setRemoteCompleted(false);
      return;
    }

    const puzzle = getTodaysPuzzle(getSport());
    const local = loadGameState(puzzle.id);
    if (local?.completed) {
      setRemoteCompleted(true);
      return;
    }

    let cancelled = false;
    fetchMyScore(getDateOverride())
      .then((score) => {
        if (!cancelled) setRemoteCompleted(Boolean(score));
      })
      .catch(() => {
        if (!cancelled) setRemoteCompleted(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const [pendingInvite, setPendingInvite] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('invite');
  });

  const [howToEntry, setHowToEntry] = useState<HowToEntryPoint>('menu');

  useEffect(() => {
    initAnalytics();
  }, []);

  const navigateToAuth = (returnTo: Screen) => {
    if (appMode) return; // app owns identity — no in-app login
    const params = new URLSearchParams(location.search);
    params.set('returnTo', returnTo);
    params.delete('authReason');
    navigate(`/auth?${params.toString()}`);
  };

  const navigateToReminderAuth = () => {
    if (appMode) return;
    const params = new URLSearchParams(location.search);
    params.set('returnTo', 'results');
    params.set('authReason', 'reminder');
    navigate(`/auth?${params.toString()}`);
  };

  useEffect(() => {
    if (!pendingInvite) return;
    if (isAuthLoading) return;
    if (isAuthenticated && screen === 'auth') {
      go('groups');
    }
  }, [isAuthenticated, isAuthLoading, pendingInvite, screen]);

  const getReturnTo = (): string | null => {
    const params = new URLSearchParams(location.search);
    return params.get('returnTo');
  };

  const getAuthReason = (): string | null => {
    const params = new URLSearchParams(location.search);
    return params.get('authReason');
  };

  const isReminderAuth = () => getReturnTo() === 'results' && getAuthReason() === 'reminder';

  const showAuthToast = (message = "You're signed in") => {
    setAuthToast(message);
    setTimeout(() => setAuthToast(''), 3000);
  };

  const handleAuthSuccess = async () => {
    await flushPendingScore().catch(() => {});

    if (pendingInvite) {
      go('groups');
      showAuthToast();
      return;
    }
    const returnTo = getReturnTo();
    const reason = getAuthReason();
    const params = new URLSearchParams(location.search);
    params.delete('authReason');
    const nextWithoutReason = params.toString();
    window.history.replaceState({}, '', nextWithoutReason ? `/?${nextWithoutReason}` : '/');

    if (returnTo === 'archive') {
      const archiveDate = new URLSearchParams(location.search).get('archiveDate');
      if (archiveDate) {
        startPracticeGame(archiveDate);
      } else {
        go('archive');
      }
      showAuthToast();
      return;
    }
    if (returnTo && ['home', 'game', 'ordering', 'results', 'groups', 'leaderboard'].includes(returnTo)) {
      go(returnTo as Screen);
    } else {
      go('home');
    }
    showAuthToast(reason === 'reminder' ? "All set! See you tomorrow" : undefined);
  };

  const startGame = () => {
    const sport = getSport();
    const puzzle = getTodaysPuzzle(sport);
    const saved = loadGameState(puzzle.id);
    markHomeIntroSeen();
    if (saved && !saved.completed) {
      go('game');
      return;
    }
    beginPuzzleSession();
    clearGameState(puzzle.id);
    go('game');
  };

  const openHowTo = (entry: HowToEntryPoint) => {
    setHowToEntry(entry);
    go('howto');
  };

  const startPracticeGame = (date: string) => {
    const sport = getSport();
    track('practice_start', { date, sport });
    clearGameState(`practice-${date}-${sport}`);
    const params = new URLSearchParams(location.search);
    params.set('date', date);
    params.set('practice', '1');
    params.delete('returnTo');
    params.delete('archiveDate');
    navigate(`/game?${params.toString()}`);
  };

  // Soft gate: logged-out users get one free archived game, then a sign-in prompt.
  const playArchivedDate = (date: string) => {
    const action = archiveGateAction({
      isAuthenticated,
      mockMode: USE_MOCK,
      freeUsed: hasUsedArchiveFreePlay(),
    });
    if (action === 'gate') {
      const params = new URLSearchParams(location.search);
      params.set('returnTo', 'archive');
      params.set('archiveDate', date);
      params.delete('practice');
      navigate(`/auth?${params.toString()}`);
      return;
    }
    if (action === 'play-free') {
      markArchiveFreePlayUsed();
    }
    startPracticeGame(date);
  };

  const exitToArchive = () => {
    const params = new URLSearchParams(location.search);
    params.delete('date');
    params.delete('practice');
    navigate(`/archive${params.toString() ? `?${params.toString()}` : ''}`);
  };

  if (isAuthLoading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <ToastRegion />
      {screen === 'home' && (
        <HomeScreen
          hasInProgressGame={(() => {
            const sport = getSport();
            const puzzle = getTodaysPuzzle(sport);
            const saved = loadGameState(puzzle.id);
            return !!saved && !saved.completed;
          })()}
          onPlay={startGame}
          hasCompletedGame={(() => {
            const sport = getSport();
            const puzzle = getTodaysPuzzle(sport);
            const saved = loadGameState(puzzle.id);
            return (!!saved && saved.completed && !allowReplay) || remoteCompleted;
          })()}
          onViewResults={() => {
            const sport = getSport();
            const puzzle = getTodaysPuzzle(sport);
            const saved = loadGameState(puzzle.id);
            if ((saved && saved.completed) || remoteCompleted) {
              go('results');
            }
          }}
          onLeaderboard={() => (isAuthenticated || USE_MOCK) ? go('leaderboard') : navigateToAuth('leaderboard')}
          showDebugTools={allowReplay}
          onGroups={() => go('groups')}
          onArchive={() => go('archive')}
          onNavigateAuth={(returnTo) => navigateToAuth(returnTo as Screen)}
          onSignOut={() => go('home')}
          onHowTo={(source) => openHowTo(source)}
        />
      )}
      {screen === 'game' && <GameScreen onFinish={() => go('results')} onHome={() => go('home')} />}
      {screen === 'ordering' && <OrderingScreen onFinish={() => go('results')} />}
      {screen === 'results' && (
        <ResultsScreen
          onHome={() => go('home')}
          onGroups={() => go('groups')}
          onLeaderboard={() => go('leaderboard')}
          onRequireAuth={(reason) => {
            if (reason === 'reminder') {
              navigateToReminderAuth();
              return;
            }
            navigateToAuth('results');
          }}
          onArchive={() => go('archive')}
          onBackToArchive={exitToArchive}
          onPlayAgain={() => startPracticeGame(getDateOverride())}
        />
      )}
      {screen === 'groups' && (
        <GroupsScreen
          onBack={() => go('home')}
          onRequireAuth={() => navigateToAuth('groups')}
          isAuthenticated={isAuthenticated}
          pendingInvite={pendingInvite ?? undefined}
          onInviteHandled={() => {
            setPendingInvite(null);
            const params = new URLSearchParams(location.search);
            params.delete('invite');
            const next = params.toString();
            window.history.replaceState({}, '', next ? `/?${next}` : '/');
          }}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={() => go('home')} />
      )}
      {screen === 'archive' && (
        <ArchiveScreen
          onBack={() => go('home')}
          onPlayPast={playArchivedDate}
        />
      )}
      {screen === 'howto' && (
        <HowToScreen
          mode={(() => {
            const sport = getSport();
            const puzzle = getTodaysPuzzle(sport);
            const saved = loadGameState(puzzle.id);
            const completed = (!!saved && saved.completed && !allowReplay) || remoteCompleted;
            return completed ? 'home' : 'play';
          })()}
          entryPoint={howToEntry}
          onPlay={startGame}
          onHome={() => go('home')}
        />
      )}
      {screen === 'auth' && !appMode && (
        <>
          <AuthScreen
            onBack={() => go('home')}
            onSuccess={() => {
              void handleAuthSuccess();
            }}
            returnTo={getReturnTo()}
            contextMessage={
              pendingInvite
                ? "You'll join a group right after signing in"
                : getReturnTo() === 'archive'
                  ? 'Sign in to keep playing past puzzles'
                  : isReminderAuth()
                    ? REMINDER_AUTH_MESSAGE
                    : undefined
            }
            reminderMode={isReminderAuth()}
          />
        </>
      )}
      {authToast && <Toast message={authToast} />}
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || '/'}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
