import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { ThemePreference } from '../lib/theme';
import { ThemeSwitch } from './ThemeSwitch';
import { Close } from './icons';
import styles from './MenuOverlay.module.css';

export type TopLevelMenuScreen = 'home' | 'results' | 'groups' | 'auth';

export interface MenuOverlayProps {
  open: boolean;
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
  onExited?: () => void;
  onNavigateHome: () => void;
  onNavigateGame: () => void;
  onNavigateResults: () => void;
  onNavigateGroups: () => void;
  onNavigateAuth: (returnTo: TopLevelMenuScreen) => void;
  onSignOut: () => void;
  onToggleHaptics: (next: boolean) => void;
  onThemeChange: (value: ThemePreference) => void;
}

const CLUTCH_PLAY_HREF = 'https://play.clutchpoints.com';
const CLOSE_ANIMATION_MS = 160;

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
  open,
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
  onExited,
  onNavigateHome,
  onNavigateGame,
  onNavigateResults,
  onNavigateGroups,
  onNavigateAuth,
  onSignOut,
  onToggleHaptics,
  onThemeChange,
}: MenuOverlayProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      return;
    }

    const timer = window.setTimeout(() => {
      onExited?.();
    }, CLOSE_ANIMATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, onExited]);

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
    onNavigateAuth(currentScreen);
  };

  const handleSignOut = () => {
    onClose();
    onSignOut();
  };

  const isTodayResumeAction = currentScreen === 'home' && hasInProgressGame;
  const isTodayActive = currentScreen === 'home' && !isTodayResumeAction;
  const isResultsActive = currentScreen === 'results';
  const isGroupsActive = currentScreen === 'groups';
  const isHowToPlayActive = currentScreen === 'home';

  return (
    <div className={open ? styles.root : styles.rootClosing}>
      <div className={styles.surface} role="dialog" aria-modal="true" aria-label="Menu">
        <div className={styles.header}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close menu"
            ref={closeButtonRef}
          >
            <Close />
          </button>
        </div>

        <nav className={styles.navSection} aria-label="Primary">
          <button
            type="button"
            onClick={handleGameNavigation}
            disabled={isTodayActive}
            className={`${isTodayActive ? styles.navButtonCurrent : styles.navButton} ${styles.menuItem}`}
            style={{ '--stagger-index': 0 } as CSSProperties}
          >
            Today's Game
          </button>
          <button
            type="button"
            className={`${isResultsActive ? styles.navButtonCurrent : styles.navButton} ${styles.menuItem}`}
            onClick={handleResultsNavigation}
            disabled={isResultsActive}
            aria-current={isResultsActive ? 'page' : undefined}
            style={{ '--stagger-index': 1 } as CSSProperties}
          >
            Leaderboard
          </button>
          <button
            type="button"
            className={`${isGroupsActive ? styles.navButtonCurrent : styles.navButton} ${styles.menuItem}`}
            onClick={handleGroupsNavigation}
            disabled={isGroupsActive}
            aria-current={isGroupsActive ? 'page' : undefined}
            style={{ '--stagger-index': 2 } as CSSProperties}
          >
            Groups
          </button>
          <button
            type="button"
            className={`${isHowToPlayActive ? styles.navButtonCurrent : styles.navButton} ${styles.menuItem}`}
            onClick={handleHomeNavigation}
            disabled={isHowToPlayActive}
            aria-current={isHowToPlayActive ? 'page' : undefined}
            style={{ '--stagger-index': 3 } as CSSProperties}
          >
            How to Play
          </button>
        </nav>

        <div className={styles.divider} />

        <div className={styles.bottomSection}>
          <div className={styles.settingsSection}>
            <div className={`${styles.settingRow} ${styles.menuItem}`} style={{ '--stagger-index': 4 } as CSSProperties}>
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

            <div className={`${styles.themeRow} ${styles.menuItem}`} style={{ '--stagger-index': 5 } as CSSProperties}>
              <span className={styles.settingLabel}>Appearance</span>
              <ThemeSwitch value={themePreference} onChange={onThemeChange} />
            </div>
          </div>

          <div className={styles.metaSection}>
            <a
              href={feedbackHref}
              className={`${styles.metaLink} ${styles.menuItem}`}
              onClick={onClose}
              style={{ '--stagger-index': 6 } as CSSProperties}
            >
              Share Feedback
            </a>
            <a
              href={clutchPlayHref}
              target="_blank"
              rel="noreferrer"
              className={`${styles.metaLink} ${styles.menuItem}`}
              onClick={onClose}
              style={{ '--stagger-index': 7 } as CSSProperties}
            >
              Check Clutch Play
            </a>

            {isAuthLoading ? (
              <div className={`${styles.authRow} ${styles.menuItem}`} style={{ '--stagger-index': 8 } as CSSProperties}>
                <span className={styles.authStatus}>Checking account…</span>
              </div>
            ) : isAuthenticated ? (
              <div className={`${styles.authRow} ${styles.menuItem}`} style={{ '--stagger-index': 8 } as CSSProperties}>
                <span className={styles.authStatus}>{truncateEmail(userEmail)}</span>
                <button type="button" className={styles.authAction} onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className={`${styles.authRow} ${styles.menuItem}`} style={{ '--stagger-index': 8 } as CSSProperties}>
                <button type="button" className={styles.authAction} onClick={handleAuthNavigation}>
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
