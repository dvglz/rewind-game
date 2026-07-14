import { useEffect, useMemo, useState } from 'react';
import {
  getDateOverride,
  getSport,
  getTodaysPuzzle,
  isRandomModeEnabled,
  setRandomModeEnabled,
  SPORT_LABELS,
  type Sport,
} from '../data/puzzles';
import { getActiveSpecial, getBannerSpecial } from '../data/specials';
import { BurgerMenu } from '../components/BurgerMenu';
import { LandingDemo } from '../components/LandingDemo';
import { Toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { isAppMode } from '../lib/appMode';
import { hasSeenHomeIntro, markHomeIntroSeen } from '../lib/homeIntro';
import styles from './HomeScreen.module.css';

// App Store link for the "Play in the iOS app" menu item. Leave empty to hide it.
const IOS_APP_URL = 'https://apps.apple.com/us/app/clutchpoints-nba-nfl-mlb/id1044413150';

interface HomeScreenProps {
  onPlay: () => void;
  hasInProgressGame: boolean;
  hasCompletedGame: boolean;
  onViewResults: () => void;
  onLeaderboard: () => void;
  showDebugTools: boolean;
  onGroups: () => void;
  onArchive: () => void;
  onNavigateAuth: (returnTo: string) => void;
  onSignOut: () => void;
  onHowTo: (source: 'menu' | 'footer') => void;
}

export function HomeScreen({
  onPlay,
  hasInProgressGame,
  hasCompletedGame,
  onViewResults,
  onLeaderboard,
  showDebugTools,
  onGroups,
  onArchive,
  onNavigateAuth,
  onSignOut,
  onHowTo,
}: HomeScreenProps) {
  const { isAuthenticated, loading: isAuthLoading, user: authUser, signOut } = useAuth();
  const currentSport = getSport();
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const [randomEnabled, setRandomEnabled] = useState(() => isRandomModeEnabled());
  const [signOutToast, setSignOutToast] = useState(false);
  const hideAuthControls = isAppMode();
  const showIntroDemo = !hideAuthControls && !isAuthenticated && !hasSeenHomeIntro();

  useEffect(() => {
    if (hideAuthControls) {
      markHomeIntroSeen();
    }
  }, [hideAuthControls]);

  const sportOptions = useMemo(() => ['american', 'soccer'] as Sport[], []);

  const switchSport = (sport: Sport) => {
    const url = new URL(window.location.href);
    url.searchParams.set('sport', sport);
    window.location.assign(url.toString());
  };

  const toggleRandom = () => {
    const next = !randomEnabled;
    setRandomEnabled(next);
    setRandomModeEnabled(next);
  };

  const dateStr = new Date(`${getDateOverride()}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const todaysPuzzle = getTodaysPuzzle(currentSport);
  const puzzleNumber = String(todaysPuzzle.number).padStart(3, '0');
  const special = todaysPuzzle.special ?? null;
  // Copy override applies in special mode; on the regular home we instead show
  // a banner promoting the special once its day has arrived.
  const specialDay = special ? getActiveSpecial() : null;
  const bannerSpecial = special ? null : getBannerSpecial(getDateOverride());

  return (
    <div className={`${styles.container} ${showIntroDemo ? '' : styles.containerCompact}`}>
      <BurgerMenu
        currentScreen="home"
        hasInProgressGame={hasInProgressGame}
        feedbackHref="mailto:feedback@example.com"
        isAuthenticated={isAuthenticated}
        isAuthLoading={isAuthLoading}
        userEmail={authUser?.email ?? null}
        userName={authUser?.username ?? null}
        onNavigateHome={() => {}}
        onNavigateGame={() => {
          if (hasCompletedGame) {
            onViewResults();
          } else {
            onPlay();
          }
        }}
        onNavigateLeaderboard={onLeaderboard}
        onNavigateGroups={onGroups}
        onNavigateArchive={onArchive}
        onNavigateAuth={onNavigateAuth}
        appStoreHref={hideAuthControls ? undefined : IOS_APP_URL || undefined}
        hideAuthControls={hideAuthControls}
        onSignOut={() => {
          signOut();
          onSignOut();
          setSignOutToast(true);
          setTimeout(() => setSignOutToast(false), 3000);
        }}
        onNavigateHowTo={() => onHowTo('menu')}
      />
      {bannerSpecial && (
        <button
          type="button"
          className={styles.specialBanner}
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('special', bannerSpecial.slug);
            window.location.assign(`/?${params.toString()}`);
          }}
        >
          {bannerSpecial.flag} Play the {bannerSpecial.label} →
        </button>
      )}
      <div className={styles.intro}>
        <span className={styles.wordmark}>Rewind</span>
        <h1 className={styles.headline}>
          {specialDay ? specialDay.homeHeadline : <>Can you guess<br/>when it happened?</>}
        </h1>
        <p className={styles.description}>
          {specialDay ? specialDay.homeSub : <>Ultimate NBA history test.<br />5 new questions, daily.</>}
        </p>
      </div>

      {showIntroDemo && <LandingDemo />}

      <div className={styles.actions}>
        {!hasCompletedGame && (
          <button className={styles.playButton} onClick={onPlay}>
            {hasInProgressGame ? 'Resume' : 'Start'}
          </button>
        )}

        {hasCompletedGame && (
          <button className={styles.playButton} onClick={onViewResults}>
            See Results
          </button>
        )}

        <p className={styles.meta}>
          #{puzzleNumber}{special ? ` ${special.flag}` : ''} · {dateStr}
        </p>

      </div>

      {showDebugTools && (
        <>
          <button
            className={styles.debugToggle}
            onClick={() => setShowDebugMenu((prev) => !prev)}
            type="button"
          >
            {showDebugMenu ? 'Hide Debug' : 'Debug'}
          </button>

          {showDebugMenu && (
        <div className={styles.debugMenu}>
          <span className={styles.debugTitle}>Debug</span>
          <label className={styles.toggleRow}>
            <span>Random questions</span>
            <input
              type="checkbox"
              checked={randomEnabled}
              onChange={toggleRandom}
            />
          </label>
          <div className={styles.sportPicker}>
            {sportOptions.map((sport) => (
              <button
                key={sport}
                onClick={() => switchSport(sport)}
                className={sport === currentSport ? styles.sportButtonActive : styles.sportButton}
              >
                {SPORT_LABELS[sport]}
              </button>
            ))}
          </div>
        </div>
          )}
        </>
      )}
      {signOutToast && <Toast message="Signed Out" />}
      {isAuthenticated && (
        <p className={styles.footerCta}>
          Settle who knows ball in{' '}
          <button type="button" className={styles.footerLink} onClick={onGroups}>
            Groups
          </button>
          .
        </p>
      )}
      {!hideAuthControls && !isAuthenticated && (
        <p className={styles.footerCta}>
          Played before?{' '}
          <button type="button" className={styles.footerLink} onClick={() => onNavigateAuth('home')}>
            Sign In
          </button>
        </p>
      )}
    </div>
  );
}
