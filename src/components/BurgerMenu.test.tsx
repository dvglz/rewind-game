import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BurgerMenu } from './BurgerMenu';

function createProps() {
  return {
    currentScreen: 'home' as const,
    hasInProgressGame: false,
    feedbackHref: 'mailto:feedback@example.com',
    hapticsEnabled: true,
    themePreference: 'system' as const,
    isAuthenticated: false,
    isAuthLoading: false,
    userEmail: null,
    onNavigateHome: vi.fn(),
    onNavigateGame: vi.fn(),
    onNavigateResults: vi.fn(),
    onNavigateGroups: vi.fn(),
    onNavigateAuth: vi.fn(),
    onSignOut: vi.fn(),
    onToggleHaptics: vi.fn(),
    onThemeChange: vi.fn(),
  };
}

describe('BurgerMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens a full-screen overlay from the trigger', () => {
    render(<BurgerMenu {...createProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect(screen.getByRole('dialog', { name: 'Menu' })).not.toBeNull();
    expect(screen.getByRole('button', { name: "Today's Game" })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Leaderboard' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Groups' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'How to Play' })).not.toBeNull();
  });

  it('marks the current top-level destination as disabled', () => {
    const props = createProps();
    render(<BurgerMenu {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const currentDestination = screen.getByRole('button', { name: "Today's Game" });
    expect(currentDestination.hasAttribute('disabled')).toBe(true);

    fireEvent.click(currentDestination);

    expect(props.onNavigateHome).not.toHaveBeenCalled();
    expect(props.onNavigateGame).not.toHaveBeenCalled();
  });

  it('keeps the menu open when toggling haptics', () => {
    const props = createProps();
    render(<BurgerMenu {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Sound & Haptics' }));

    expect(props.onToggleHaptics).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog', { name: 'Menu' })).not.toBeNull();
  });

  it('closes and routes to auth on sign in', () => {
    const props = createProps();
    render(<BurgerMenu {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(props.onNavigateAuth).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
  });

  it('closes on Escape', () => {
    render(<BurgerMenu {...createProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
  });
});
