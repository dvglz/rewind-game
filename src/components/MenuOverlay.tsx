import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Close } from './icons';
import styles from './MenuOverlay.module.css';

export type TopLevelMenuScreen = 'home' | 'results' | 'groups' | 'auth' | 'leaderboard';

export interface MenuOverlayProps {
  open: boolean;
  currentScreen: TopLevelMenuScreen;
  hasInProgressGame: boolean;
  feedbackHref?: string;
  clutchPlayHref?: string;
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
  userEmail: string | null;
  userName: string | null;
  onClose: () => void;
  onExited?: () => void;
  onNavigateHome: () => void;
  onNavigateGame: () => void;
  onNavigateLeaderboard: () => void;
  onNavigateGroups: () => void;
  onNavigateAuth: (returnTo: TopLevelMenuScreen) => void;
  onSignOut: () => void;
}

const CLOSE_ANIMATION_MS = 160;
const MAX_TRUNCATED_EMAIL_LENGTH = 28;
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function displayIdentity(email: string | null, name: string | null): string {
  if (email) {
    if (email.length <= MAX_TRUNCATED_EMAIL_LENGTH) return email;

    const [localPart, domain = ''] = email.split('@');
    if (!domain) return `${email.slice(0, MAX_TRUNCATED_EMAIL_LENGTH - 1)}…`;

    const availableDomainLength = MAX_TRUNCATED_EMAIL_LENGTH - localPart.length - 2;
    if (availableDomainLength <= 0) return `${email.slice(0, MAX_TRUNCATED_EMAIL_LENGTH - 1)}…`;

    return `${localPart}@${domain.slice(0, availableDomainLength)}…`;
  }

  if (name) return name;

  return 'Signed in';
}

export function MenuOverlay({
  open,
  currentScreen,
  hasInProgressGame,
  isAuthenticated,
  isAuthLoading = false,
  userEmail,
  userName,
  onClose,
  onExited,
  onNavigateGame,
  onNavigateLeaderboard,
  onNavigateGroups,
  onNavigateAuth,
  onSignOut,
}: MenuOverlayProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const getFocusableElements = () => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return [];
    }

    return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1,
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
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
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
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
    onNavigateGame();
  };

  const handleLeaderboardNavigation = () => {
    onClose();
    onNavigateLeaderboard();
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
  const isLeaderboardActive = currentScreen === 'leaderboard';
  const isGroupsActive = currentScreen === 'groups';
  const overlay = (
    <div className={open ? styles.root : styles.rootClosing} data-theme-invert>
      <div className={styles.surface} role="dialog" aria-modal="true" aria-label="Menu" ref={dialogRef}>
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
            aria-current={isTodayActive ? 'page' : undefined}
            style={{ '--stagger-index': 0 } as CSSProperties}
          >
            Today's Game
          </button>
          <button
            type="button"
            className={`${isLeaderboardActive ? styles.navButtonCurrent : styles.navButton} ${styles.menuItem}`}
            onClick={handleLeaderboardNavigation}
            disabled={isLeaderboardActive}
            aria-current={isLeaderboardActive ? 'page' : undefined}
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
        </nav>

        <div className={styles.bottomSection}>
          <div className={styles.divider} />
          <div className={styles.metaSection}>
            {isAuthLoading ? (
              <div className={`${styles.authRow} ${styles.menuItem}`} style={{ '--stagger-index': 3 } as CSSProperties}>
                <span className={styles.authStatus}>Checking account…</span>
              </div>
            ) : isAuthenticated ? (
              <div className={`${styles.authRow} ${styles.menuItem}`} style={{ '--stagger-index': 3 } as CSSProperties}>
                <span className={styles.authStatus}>{displayIdentity(userEmail, userName)}</span>
                <button type="button" className={styles.authAction} onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className={`${styles.authRow} ${styles.menuItem}`} style={{ '--stagger-index': 3 } as CSSProperties}>
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

  return createPortal(overlay, document.body);
}
