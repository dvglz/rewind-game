import { useEffect, useRef, useState } from 'react';
import type { ThemePreference } from '../lib/theme';
import { MenuOverlay, type TopLevelMenuScreen } from './MenuOverlay';
import styles from './BurgerMenu.module.css';

interface MenuItem {
  label: string;
  onClick: () => void;
}

interface LegacyBurgerMenuProps {
  items: MenuItem[];
}

interface OverlayBurgerMenuProps {
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

export type BurgerMenuProps = LegacyBurgerMenuProps | OverlayBurgerMenuProps;

function hasLegacyItems(props: BurgerMenuProps): props is LegacyBurgerMenuProps {
  return 'items' in props;
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

  const overlayProps = hasLegacyItems(props)
    ? {
        currentScreen: 'home' as const,
        hasInProgressGame: false,
        feedbackHref: 'mailto:feedback@example.com',
        hapticsEnabled: true,
        themePreference: 'system' as const,
        isAuthenticated: false,
        isAuthLoading: false,
        userEmail: null,
        onNavigateHome: props.items.find((item) => item.label === 'How to Play')?.onClick ?? (() => {}),
        onNavigateGame: props.items.find((item) => item.label === "Today's Game")?.onClick ?? (() => {}),
        onNavigateResults: props.items.find((item) => item.label === 'Leaderboard')?.onClick ?? (() => {}),
        onNavigateGroups: props.items.find((item) => item.label === 'Groups')?.onClick ?? (() => {}),
        onNavigateAuth: () => {},
        onSignOut: () => {},
        onToggleHaptics: () => {},
        onThemeChange: () => {},
      }
    : props;

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
          {...overlayProps}
          open={open}
          onClose={handleClose}
          onExited={handleExited}
        />
      )}
    </div>
  );
}
