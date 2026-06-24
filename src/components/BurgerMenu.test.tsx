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
    userName: null,
    onNavigateHome: vi.fn(),
    onNavigateGame: vi.fn(),
    onNavigateLeaderboard: vi.fn(),
    onNavigateGroups: vi.fn(),
    onNavigateArchive: vi.fn(),
    onNavigateHowTo: vi.fn(),
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
    expect(screen.getByRole('button', { name: 'My Group' })).not.toBeNull();
    expect(screen.queryByText('Sound & Haptics')).toBeNull();
    expect(screen.queryByText('Appearance')).toBeNull();
    expect(screen.getByRole('button', { name: 'Close menu' }) === document.activeElement).toBe(true);
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('renders an Archive item that routes to the archive', () => {
    const props = createProps();
    render(<BurgerMenu {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rewind Archive' }));

    expect(props.onNavigateArchive).toHaveBeenCalledTimes(1);
  });

  it("keeps Today's Game actionable on Home and routes to the game", () => {
    const props = createProps();
    render(<BurgerMenu {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const todaysGame = screen.getByRole('button', { name: "Today's Game" });
    expect(todaysGame.hasAttribute('disabled')).toBe(false);
    expect(todaysGame.getAttribute('aria-current')).toBeNull();

    fireEvent.click(todaysGame);

    expect(props.onNavigateGame).toHaveBeenCalledTimes(1);
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

  it('shows username when email is null (Google sign-in)', () => {
    render(
      <BurgerMenu
        {...createProps()}
        isAuthenticated={true}
        userEmail={null}
        userName="Allies"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect(screen.getByText('Allies')).not.toBeNull();
  });

  it('prefers username over email when both are present', () => {
    render(
      <BurgerMenu
        {...createProps()}
        isAuthenticated={true}
        userEmail="someone@example.com"
        userName="Allies"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect(screen.getByText('Allies')).not.toBeNull();
    expect(screen.queryByText('someone@example.com')).toBeNull();
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

  it('hides Sign Out but keeps the status line when hideAuthControls is set', () => {
    render(
      <BurgerMenu
        {...createProps()}
        isAuthenticated={true}
        userEmail="me@example.com"
        hideAuthControls={true}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect(screen.queryByRole('button', { name: 'Sign Out' })).toBeNull();
    expect(screen.getByText('me@example.com')).not.toBeNull();
  });

  it('hides the Sign In CTA when hideAuthControls is set and the user is anonymous', () => {
    render(<BurgerMenu {...createProps()} hideAuthControls={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect(screen.queryByRole('button', { name: 'Sign In' })).toBeNull();
  });
});
