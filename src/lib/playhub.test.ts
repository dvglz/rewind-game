import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock import.meta.env
vi.stubEnv('VITE_BASE_URL', 'https://clutchpoints.4taps.me');
vi.stubEnv('VITE_MOCK_API', 'false');

beforeEach(() => {
  mockFetch.mockReset();
  // Clear cookies
  document.cookie = 'cp_access_token=; max-age=0';
  document.cookie = 'sbc_access_token=; max-age=0';
});

describe('playhub API', () => {
  // Dynamic import to pick up env stub
  let fetchGroup: typeof import('./playhub').fetchGroup;
  let createGroup: typeof import('./playhub').createGroup;
  let joinGroup: typeof import('./playhub').joinGroup;
  let leaveGroup: typeof import('./playhub').leaveGroup;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./playhub');
    fetchGroup = mod.fetchGroup;
    createGroup = mod.createGroup;
    joinGroup = mod.joinGroup;
    leaveGroup = mod.leaveGroup;
  });

  describe('fetchGroup', () => {
    it('returns group data on 201', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 201,
        ok: true,
        json: async () => ({ id: 1, name: 'test', invite_link: 'ABC123', members: [] }),
      });
      const result = await fetchGroup();
      expect(result).toEqual({ id: 1, name: 'test', invite_link: 'ABC123', members: [] });
    });

    it('returns null on 204 (no group)', async () => {
      mockFetch.mockResolvedValueOnce({ status: 204, ok: true });
      const result = await fetchGroup();
      expect(result).toBeNull();
    });
  });

  describe('createGroup', () => {
    it('returns created group on success', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 201,
        ok: true,
        json: async () => ({ id: 2, name: 'new-group', invite_link: 'XYZ', members: [] }),
      });
      const result = await createGroup('new-group');
      expect(result.name).toBe('new-group');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/playhub/groups/'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws on 400 (name taken)', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: async () => ({ detail: 'Group name is already taken' }),
      });
      await expect(createGroup('taken')).rejects.toThrow('Group name is already taken');
    });
  });

  describe('joinGroup', () => {
    it('joins with invite code', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ group: 1, user: 'u1', joined_at: '2026-01-01T00:00:00Z' }),
      });
      const result = await joinGroup('ABC123');
      expect(result.group).toBe(1);
    });

    it('throws on 400 (invalid code)', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: async () => ({ detail: "Check the code again" }),
      });
      await expect(joinGroup('BADCODE')).rejects.toThrow();
    });
  });

  describe('leaveGroup', () => {
    it('resolves on 204', async () => {
      mockFetch.mockResolvedValueOnce({ status: 204, ok: true });
      await expect(leaveGroup()).resolves.toBeUndefined();
    });
  });
});
