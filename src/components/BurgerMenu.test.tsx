import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BurgerMenu } from './BurgerMenu';

function createProps() {
  return {
    currentScreen: 'home' as const,
    hasInProgressGame: false,
    feedbackHref: 'mailto:feedback@example.com',
    isAuthenticated: false,
    isAuthLoading: false,
    userEmail: null,
    onNavigateHome: vi.fn(),
    onNavigateGame: vi.fn(),
    onNavigateLeaderboard: vi.fn(),
    onNavigateGroups: vi.fn(),
    onNavigateAuth: vi.fn(),
    onSignOut: vi.fn(),
  };
}

describe('BurgerMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('opens a full-screen overlay from the trigger', () => {
    const { container } = render(<BurgerMenu {...createProps()} />);

    const trigger = screen.getByRole('button', { name: 'Menu' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(dialog).not.toBeNull();
    expect(screen.getByRole('button', { name: "Today's Game" })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Leaderboard' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Groups' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'How to Play' })).not.toBeNull();
    expect(screen.queryByText('Sound & Haptics')).toBeNull();
    expect(screen.queryByText('Appearance')).toBeNull();
    expect(screen.getByRole('button', { name: 'Close menu' }) === document.activeElement).toBe(true);
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it("marks Today's Game as current and non-interactive when Home is the active destination", () => {
    const props = createProps();
    render(<BurgerMenu {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const currentDestination = screen.getByRole('button', { name: "Today's Game" });
    expect(currentDestination.hasAttribute('disabled')).toBe(true);
    expect(currentDestination.getAttribute('aria-current')).toBe('page');

    fireEvent.click(currentDestination);

    expect(props.onNavigateHome).not.toHaveBeenCalled();
    expect(props.onNavigateGame).not.toHaveBeenCalled();
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

  it('cycles focus within the dialog while open', () => {
    render(<BurgerMenu {...createProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const closeButton = screen.getByRole('button', { name: 'Close menu' });
    const signInButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(signInButton);

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);
  });

  it('truncates long signed-in emails even when the domain is the long part', () => {
    render(
      <BurgerMenu
        {...createProps()}
        isAuthenticated={true}
        userEmail="me@averyveryveryverylongdomainexample.com"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect(screen.getByText('me@averyveryveryverylongdom…')).not.toBeNull();
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
    expect(document.body.style.overflow).toBe('');
    vi.useRealTimers();
  });
});
