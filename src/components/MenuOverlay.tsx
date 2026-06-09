import { useEffect } from 'react';
import type { ThemePreference } from '../lib/theme';
import { ThemeSwitch } from './ThemeSwitch';
import { Close } from './icons';
import styles from './MenuOverlay.module.css';

export type TopLevelMenuScreen = 'home' | 'results' | 'groups' | 'auth';

export interface MenuOverlayProps {
  currentScreen: TopLevelMenuScreen;
  hasInProgressGame: boolean;
  feedbackHref: string;
  clutchPlayHref?: string;
  hapticsEnabled: boolean;
  themePreference: ThemePreference;
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
  userEmail: string | null;
  onClose: () => void;
  onNavigateHome: () => void;
  onNavigateGame: () => void;
  onNavigateResults: () => void;
  onNavigateGroups: () => void;
  onNavigateAuth: () => void;
  onSignOut: () => void;
  onToggleHaptics: (next: boolean) => void;
  onThemeChange: (value: ThemePreference) => void;
}

const CLUTCH_PLAY_HREF = 'https://play.clutchpoints.com';

function truncateEmail(email: string | null): string {
  if (!email) {
    return 'Signed in';
  }

  if (email.length <= 28) {
    return email;
  }

  const [localPart, domain = ''] = email.split('@');
  const shortenedLocal = localPart.length > 12 ? `${localPart.slice(0, 12)}…` : localPart;

  return domain ? `${shortenedLocal}@${domain}` : `${email.slice(0, 24)}…`;
}

export function MenuOverlay({
  currentScreen,
  hasInProgressGame,
  feedbackHref,
  clutchPlayHref = CLUTCH_PLAY_HREF,
  hapticsEnabled,
  themePreference,
  isAuthenticated,
  isAuthLoading = false,
  userEmail,
  onClose,
  onNavigateHome,
  onNavigateGame,
  onNavigateResults,
  onNavigateGroups,
  onNavigateAuth,
  onSignOut,
  onToggleHaptics,
  onThemeChange,
}: MenuOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleGameNavigation = () => {
    onClose();

    if (hasInProgressGame) {
      onNavigateGame();
      return;
    }

    onNavigateHome();
  };

  const handleHomeNavigation = () => {
    onClose();
    onNavigateHome();
  };

  const handleResultsNavigation = () => {
    onClose();
    onNavigateResults();
  };

  const handleGroupsNavigation = () => {
    onClose();
    onNavigateGroups();
  };

  const handleAuthNavigation = () => {
    onClose();
    onNavigateAuth();
  };

  const handleSignOut = () => {
    onClose();
    onSignOut();
  };

  const isTodayActive = currentScreen === 'home';
  const isResultsActive = currentScreen === 'results';
  const isGroupsActive = currentScreen === 'groups';

  return (
    <div className={styles.root}>
      <div className={styles.surface} role="dialog" aria-modal="true" aria-label="Menu">
        <div className={styles.header}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close menu"
          >
            <Close />
          </button>
        </div>

        <nav className={styles.navSection} aria-label="Primary">
          <button
            type="button"
            className={isTodayActive ? styles.navButtonCurrent : styles.navButton}
            onClick={handleGameNavigation}
            disabled={isTodayActive}
            aria-current={isTodayActive ? 'page' : undefined}
          >
            Today's Game
          </button>
          <button
            type="button"
            className={isResultsActive ? styles.navButtonCurrent : styles.navButton}
            onClick={handleResultsNavigation}
            disabled={isResultsActive}
            aria-current={isResultsActive ? 'page' : undefined}
          >
            Leaderboard
          </button>
          <button
            type="button"
            className={isGroupsActive ? styles.navButtonCurrent : styles.navButton}
            onClick={handleGroupsNavigation}
            disabled={isGroupsActive}
            aria-current={isGroupsActive ? 'page' : undefined}
          >
            Groups
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={handleHomeNavigation}
          >
            How to Play
          </button>
        </nav>

        <div className={styles.settingsSection}>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Sound &amp; Haptics</span>
            <button
              type="button"
              role="switch"
              aria-label="Sound & Haptics"
              aria-checked={hapticsEnabled}
              className={hapticsEnabled ? styles.switchEnabled : styles.switch}
              onClick={() => onToggleHaptics(!hapticsEnabled)}
            >
              <span className={styles.switchThumb} />
            </button>
          </div>

          <div className={styles.themeRow}>
            <span className={styles.settingLabel}>Appearance</span>
            <ThemeSwitch value={themePreference} onChange={onThemeChange} />
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.metaSection}>
          <a
            href={feedbackHref}
            className={styles.metaLink}
            onClick={onClose}
          >
            Share Feedback
          </a>
          <a
            href={clutchPlayHref}
            target="_blank"
            rel="noreferrer"
            className={styles.metaLink}
            onClick={onClose}
          >
            Check Clutch Play
          </a>

          {isAuthLoading ? (
            <div className={styles.authRow}>
              <span className={styles.authStatus}>Checking account…</span>
            </div>
          ) : isAuthenticated ? (
            <div className={styles.authRow}>
              <span className={styles.authStatus}>{truncateEmail(userEmail)}</span>
              <button type="button" className={styles.authAction} onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className={styles.authRow}>
              <button type="button" className={styles.authAction} onClick={handleAuthNavigation}>
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
