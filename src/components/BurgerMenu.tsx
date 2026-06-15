import { useRef, useState } from 'react';
import { MenuOverlay, type TopLevelMenuScreen } from './MenuOverlay';
import styles from './BurgerMenu.module.css';

export interface BurgerMenuProps {
  currentScreen: TopLevelMenuScreen;
  hasInProgressGame: boolean;
  feedbackHref: string;
  clutchPlayHref?: string;
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
  userEmail: string | null;
  userName: string | null;
  onNavigateHome: () => void;
  onNavigateGame: () => void;
  onNavigateLeaderboard: () => void;
  onNavigateGroups: () => void;
  onNavigateHowTo: () => void;
  onNavigateAuth: (returnTo: TopLevelMenuScreen) => void;
  onSignOut: () => void;
}

export function BurgerMenu(props: BurgerMenuProps) {
  const [open, setOpen] = useState(false);
  const [renderOverlay, setRenderOverlay] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
