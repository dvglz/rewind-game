import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  document.cookie = 'cp_access_token=; max-age=0';
});

describe('cookie helpers', () => {
  let getAccessToken: typeof import('./auth').getAccessToken;
  let setAccessToken: typeof import('./auth').setAccessToken;
  let clearAccessToken: typeof import('./auth').clearAccessToken;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./auth');
    getAccessToken = mod.getAccessToken;
    setAccessToken = mod.setAccessToken;
    clearAccessToken = mod.clearAccessToken;
  });

  it('returns null when no token cookie exists', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('sets and reads cp_access_token cookie', () => {
    setAccessToken('test-token-123');
    expect(getAccessToken()).toBe('test-token-123');
  });

  it('clears the token cookie', () => {
    setAccessToken('test-token-123');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
vi.stubEnv('VITE_BASE_URL', 'https://clutchpoints-users-test.4taps.me');

describe('loginWithGoogle', () => {
  let loginWithGoogle: typeof import('./auth').loginWithGoogle;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    document.cookie = 'cp_access_token=; max-age=0';
    const mod = await import('./auth');
    loginWithGoogle = mod.loginWithGoogle;
  });

  it('posts credential and returns user', async () => {
    const fakeUser = {
      id: 1, objectId: 'abc', username: 'testuser', email: 'test@example.com',
      firstName: 'Test', lastName: 'User', accessToken: 'tok_123',
      avatarUrl: null, thumbnailUrl: null,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true, json: async () => fakeUser,
    });

    const user = await loginWithGoogle('google-jwt-credential');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://clutchpoints-users-test.4taps.me/user/auth/google/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ credential: 'google-jwt-credential' }),
      }),
    );
    expect(user.accessToken).toBe('tok_123');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false, status: 400,
      json: async () => ({ detail: 'Invalid token' }),
    });
    await expect(loginWithGoogle('bad')).rejects.toThrow('Invalid token');
  });
});

describe('fetchProfile', () => {
  let fetchProfile: typeof import('./auth').fetchProfile;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    document.cookie = 'cp_access_token=; max-age=0';
    const mod = await import('./auth');
    fetchProfile = mod.fetchProfile;
  });

  it('returns user when token is valid', async () => {
    document.cookie = 'cp_access_token=valid-tok';
    const fakeUser = {
      id: 1, objectId: 'abc', username: 'testuser', email: 'test@example.com',
      firstName: 'Test', lastName: 'User', accessToken: 'valid-tok',
      avatarUrl: null, thumbnailUrl: null,
    };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => fakeUser });

    const user = await fetchProfile();
    expect(user).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://clutchpoints-users-test.4taps.me/user/profile/',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Token valid-tok' }),
      }),
    );
  });

  it('returns null when no token exists', async () => {
    const user = await fetchProfile();
    expect(user).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null on non-ok response', async () => {
    document.cookie = 'cp_access_token=expired-tok';
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const user = await fetchProfile();
    expect(user).toBeNull();
  });
});

describe('loginWithEmail', () => {
  let loginWithEmail: typeof import('./auth').loginWithEmail;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    const mod = await import('./auth');
    loginWithEmail = mod.loginWithEmail;
  });

  it('posts email and redirect URI', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await loginWithEmail('user@example.com', 'https://app.com/?mode=auth&returnTo=groups');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://clutchpoints-users-test.4taps.me/user/auth/email/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          redirect_uri: 'https://app.com/?mode=auth&returnTo=groups',
          app: 'rewind',
        }),
      }),
    );
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false, status: 400,
      json: async () => ({ detail: 'Invalid email' }),
    });
    await expect(loginWithEmail('bad', 'https://app.com')).rejects.toThrow('Invalid email');
  });
});
