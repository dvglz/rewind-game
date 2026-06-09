import { useEffect, useRef, useState } from 'react';
import type { ThemePreference } from '../lib/theme';
import { MenuOverlay, type TopLevelMenuScreen } from './MenuOverlay';
import styles from './BurgerMenu.module.css';

export interface BurgerMenuProps {
  currentScreen: TopLevelMenuScreen;
  hasInProgressGame: boolean;
  feedbackHref: string;
  clutchPlayHref?: string;
  hapticsEnabled: boolean;
  themePreference: ThemePreference;
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
  userEmail: string | null;
  onNavigateHome: () => void;
  onNavigateGame: () => void;
  onNavigateResults: () => void;
  onNavigateGroups: () => void;
  onNavigateAuth: (returnTo: TopLevelMenuScreen) => void;
  onSignOut: () => void;
  onToggleHaptics: (next: boolean) => void;
  onThemeChange: (value: ThemePreference) => void;
}

export function BurgerMenu(props: BurgerMenuProps) {
  const [open, setOpen] = useState(false);
  const [renderOverlay, setRenderOverlay] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setRenderOverlay(true);
    }
  }, [open]);

  const handleOpen = () => {
    setRenderOverlay(true);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleExited = () => {
    setRenderOverlay(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => {
          if (open) {
            handleClose();
            return;
          }

          handleOpen();
        }}
        type="button"
        aria-label="Menu"
        aria-expanded={open ? 'true' : 'false'}
      >
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </button>

      {renderOverlay && (
        <MenuOverlay
          {...props}
          open={open}
          onClose={handleClose}
          onExited={handleExited}
        />
      )}
    </div>
  );
}
