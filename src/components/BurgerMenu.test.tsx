import { act, fireEvent, render, screen } from '@testing-library/react';
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

    const trigger = screen.getByRole('button', { name: 'Menu' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Menu' })).not.toBeNull();
    expect(screen.getByRole('button', { name: "Today's Game" })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Leaderboard' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Groups' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'How to Play' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Close menu' }) === document.activeElement).toBe(true);
  });

  it('marks Home instructional entry as current and non-interactive', () => {
    const props = createProps();
    render(<BurgerMenu {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const currentDestination = screen.getByRole('button', { name: 'How to Play' });
    expect(currentDestination.hasAttribute('disabled')).toBe(true);
    expect(currentDestination.getAttribute('aria-current')).toBe('page');

    fireEvent.click(currentDestination);

    expect(props.onNavigateHome).not.toHaveBeenCalled();
  });

  it("keeps Today's Game actionable as a resume action on Home", () => {
    const props = createProps();
    render(<BurgerMenu {...props} hasInProgressGame={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const todaysGame = screen.getByRole('button', { name: "Today's Game" });
    expect(todaysGame.hasAttribute('disabled')).toBe(false);
    expect(todaysGame.getAttribute('aria-current')).toBeNull();

    fireEvent.click(todaysGame);

    expect(props.onNavigateGame).toHaveBeenCalledTimes(1);
  });

  it('routes resume through the game callback and closes after the fade', () => {
    vi.useFakeTimers();
    const props = createProps();
    render(<BurgerMenu {...props} hasInProgressGame={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: "Today's Game" }));

    expect(props.onNavigateGame).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog', { name: 'Menu' })).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
    vi.useRealTimers();
  });

  it('keeps the menu open when toggling haptics', () => {
    const props = createProps();
    render(<BurgerMenu {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Sound & Haptics' }));

    expect(props.onToggleHaptics).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog', { name: 'Menu' })).not.toBeNull();
  });

  it('closes and routes to auth on sign in with returnTo set to the current screen', () => {
    vi.useFakeTimers();
    const props = createProps();
    render(<BurgerMenu {...props} currentScreen="groups" />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(props.onNavigateAuth).toHaveBeenCalledWith('groups');
    expect(screen.getByRole('dialog', { name: 'Menu' })).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
    vi.useRealTimers();
  });

  it('closes on Escape', () => {
    vi.useFakeTimers();
    render(<BurgerMenu {...createProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.keyDown(document, { key: 'Escape' });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
    vi.useRealTimers();
  });
});
