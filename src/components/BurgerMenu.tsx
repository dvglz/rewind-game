import { useMemo, useState } from 'react';
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
  onNavigateAuth: () => void;
  onSignOut: () => void;
  onToggleHaptics: (next: boolean) => void;
  onThemeChange: (value: ThemePreference) => void;
}

export type BurgerMenuProps = LegacyBurgerMenuProps | OverlayBurgerMenuProps;

const noop = () => {};

function hasLegacyItems(props: BurgerMenuProps): props is LegacyBurgerMenuProps {
  return 'items' in props;
}

export function BurgerMenu(props: BurgerMenuProps) {
  const [open, setOpen] = useState(false);
  const overlayProps = useMemo(() => {
    if (!hasLegacyItems(props)) {
      return props;
    }

    const groupsItem = props.items.find((item) => item.label.toLowerCase() === 'groups');

    return {
      currentScreen: 'home' as const,
      hasInProgressGame: false,
      feedbackHref: 'mailto:feedback@example.com',
      clutchPlayHref: 'https://play.clutchpoints.com',
      hapticsEnabled: true,
      themePreference: 'system' as const,
      isAuthenticated: false,
      isAuthLoading: false,
      userEmail: null,
      onNavigateHome: noop,
      onNavigateGame: noop,
      onNavigateResults: noop,
      onNavigateGroups: groupsItem?.onClick ?? noop,
      onNavigateAuth: noop,
      onSignOut: noop,
      onToggleHaptics: noop,
      onThemeChange: noop,
    };
  }, [props]);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
        aria-label="Menu"
      >
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </button>

      {open && (
        <MenuOverlay
          {...overlayProps}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
