import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../lib/auth', () => ({
  fetchProfile: vi.fn(),
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock('../engine/storage', () => ({
  clearAllGameStates: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  clearScoreSyncState: vi.fn(),
}));

function TestConsumer() {
  const { user, loading, isAuthenticated, signOut } = useAuth();
  if (loading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="name">{user?.firstName ?? 'none'}</span>
      <button onClick={signOut} type="button">sign out</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading then resolves to unauthenticated when no token', async () => {
    const { fetchProfile } = await import('../lib/auth');
    (fetchProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByText('loading')).toBeTruthy();

    await act(async () => {});

    expect(screen.getByTestId('authed').textContent).toBe('false');
    expect(screen.getByTestId('name').textContent).toBe('none');
  });

  it('resolves to authenticated when profile returns user', async () => {
    const { fetchProfile } = await import('../lib/auth');
    (fetchProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, objectId: 'abc', username: 'testuser', email: 'test@example.com',
      firstName: 'Test', lastName: 'User', accessToken: 'tok_123',
      avatarUrl: null, thumbnailUrl: null,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {});

    expect(screen.getByTestId('authed').textContent).toBe('true');
    expect(screen.getByTestId('name').textContent).toBe('Test');
  });

  it('clears auth and local game state on sign out', async () => {
    const { fetchProfile, clearAccessToken } = await import('../lib/auth');
    const { clearAllGameStates } = await import('../engine/storage');
    const { clearScoreSyncState } = await import('../lib/api');
    (fetchProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, objectId: 'abc', username: 'testuser', email: 'test@example.com',
      firstName: 'Test', lastName: 'User', accessToken: 'tok_123',
      avatarUrl: null, thumbnailUrl: null,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {});
    await act(async () => {
      screen.getByText('sign out').click();
    });

    expect(clearAccessToken).toHaveBeenCalledTimes(1);
    expect(clearAllGameStates).toHaveBeenCalledTimes(1);
    expect(clearScoreSyncState).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('authed').textContent).toBe('false');
  });
});
