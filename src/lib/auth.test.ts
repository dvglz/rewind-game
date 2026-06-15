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

  it('prefers the last cp_access_token when duplicate cookies exist', () => {
    const original = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'cp_access_token=old-user; foo=1; cp_access_token=new-user',
      set: () => {},
    });
    try {
      expect(getAccessToken()).toBe('new-user');
    } finally {
      if (original) {
        Object.defineProperty(document, 'cookie', original);
      }
    }
  });

  it('clears both host-only and parent-domain token cookies', () => {
    const original = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    const writes: string[] = [];
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => '',
      set: (value: string) => {
        writes.push(value);
      },
    });
    try {
      clearAccessToken();

      expect(writes.length).toBeGreaterThan(1);
      expect(writes.some((value) => value.startsWith('cp_access_token='))).toBe(true);
      expect(writes.some((value) => value.startsWith('sbc_access_token='))).toBe(true);
      expect(writes.some((value) => !value.includes('domain='))).toBe(true);
    } finally {
      if (original) {
        Object.defineProperty(document, 'cookie', original);
      }
    }
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

describe('requestEmailCode', () => {
  let requestEmailCode: typeof import('./auth').requestEmailCode;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    const mod = await import('./auth');
    requestEmailCode = mod.requestEmailCode;
  });

  it('posts email with app=true so the backend emails a code', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await requestEmailCode('user@example.com');

    const calledUrl = (mockFetch.mock.calls[0] as [string, RequestInit])[0];
    const url = new URL(calledUrl);
    expect(url.pathname).toBe('/user/auth/email/');
    expect(url.searchParams.get('email')).toBe('user@example.com');
    expect(url.searchParams.get('app')).toBe('true');
    expect(url.searchParams.has('redirect_uri')).toBe(true);
    expect((mockFetch.mock.calls[0] as [string, RequestInit])[1].method).toBe('POST');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false, status: 400,
      json: async () => ({ detail: 'Invalid email' }),
    });
    await expect(requestEmailCode('bad')).rejects.toThrow('Invalid email');
  });
});

describe('validateEmailCode', () => {
  let validateEmailCode: typeof import('./auth').validateEmailCode;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    const mod = await import('./auth');
    validateEmailCode = mod.validateEmailCode;
  });

  it('posts email and code, returning the authenticated user', async () => {
    const fakeUser = {
      id: 1, objectId: 'abc', username: 'testuser', email: 'user@example.com',
      firstName: 'Test', lastName: 'User', accessToken: 'tok_456',
      avatarUrl: null, thumbnailUrl: null,
    };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => fakeUser });

    const user = await validateEmailCode('user@example.com', '123456');

    const [calledUrl, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(new URL(calledUrl).pathname).toBe('/user/email/validate/');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ email: 'user@example.com', code: '123456' });
    expect(user.accessToken).toBe('tok_456');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false, status: 400,
      json: async () => ({ detail: 'Invalid code' }),
    });
    await expect(validateEmailCode('user@example.com', '000000')).rejects.toThrow('Invalid code');
  });
});
