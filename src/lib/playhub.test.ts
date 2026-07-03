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
  let fetchGroups: typeof import('./playhub').fetchGroups;
  let fetchGroup: typeof import('./playhub').fetchGroup;
  let createGroup: typeof import('./playhub').createGroup;
  let joinGroup: typeof import('./playhub').joinGroup;
  let leaveGroup: typeof import('./playhub').leaveGroup;
  let claimReward: typeof import('./playhub').claimReward;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./playhub');
    fetchGroups = mod.fetchGroups;
    fetchGroup = mod.fetchGroup;
    createGroup = mod.createGroup;
    joinGroup = mod.joinGroup;
    leaveGroup = mod.leaveGroup;
    claimReward = mod.claimReward;
  });

  describe('fetchGroups', () => {
    it('returns groups from the multi-group response', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          groups: [
            { id: 1, name: 'test', invite_link: 'ABC123', members_count: 1, members: [] },
            { id: 2, name: 'bigger', invite_link: 'XYZ987', members_count: 3, members: [] },
          ],
        }),
      });
      const result = await fetchGroups();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('test');
    });

    it('returns an empty list on 204 (no groups)', async () => {
      mockFetch.mockResolvedValueOnce({ status: 204, ok: true });
      const result = await fetchGroups();
      expect(result).toEqual([]);
    });

    it('returns seeded local groups in mock mode', async () => {
      try {
        vi.stubEnv('VITE_MOCK_API', 'true');
        vi.resetModules();
        const mod = await import('./playhub');

        const result = await mod.fetchGroups();

        expect(result.length).toBeGreaterThan(1);
        expect(result.map((group) => group.name)).toContain('the boys');
        expect(result.every((group) => Array.isArray(group.members))).toBe(true);
        expect(mockFetch).not.toHaveBeenCalled();
      } finally {
        vi.stubEnv('VITE_MOCK_API', 'false');
      }
    });
  });

  describe('fetchGroup', () => {
    it('normalizes group detail members from the backend detail shape', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          id: 42,
          name: 'Clutchest',
          invite_link: 'ABC123',
          members_count: 2,
          members: [
            { user_id: 7, username: 'You', joined_at: '2026-06-01T00:00:00Z' },
            { user_id: 9, username: 'Mike', joined_at: '2026-06-02T00:00:00Z' },
          ],
        }),
      });

      const result = await fetchGroup(42);

      expect(result.members).toEqual([
        { group: 42, user: { id: 7, username: 'You' }, joined_at: '2026-06-01T00:00:00Z' },
        { group: 42, user: { id: 9, username: 'Mike' }, joined_at: '2026-06-02T00:00:00Z' },
      ]);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://clutchpoints.4taps.me/playhub/groups/42/',
        expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
      );
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
    it('returns the joined group', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ id: 1, name: 'joined', invite_link: 'ABC123', members_count: 1, members: [] }),
      });
      const result = await joinGroup('ABC123');
      expect(result.name).toBe('joined');
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
    it('leaves the requested group by id', async () => {
      mockFetch.mockResolvedValueOnce({ status: 204, ok: true });
      await expect(leaveGroup(42)).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://clutchpoints.4taps.me/playhub/groups/42/',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('claimReward', () => {
    it('no-ops (no fetch) when unauthenticated', async () => {
      const result = await claimReward('participant');
      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('POSTs the claim with auth header and returns true on 2xx', async () => {
      document.cookie = 'cp_access_token=tok123';
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

      const result = await claimReward('mission_2');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://clutchpoints.4taps.me/playhub/claim/',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Token tok123' }),
          body: JSON.stringify({
            game_type: 'REWIND',
            game_mode: 'rewind_nba',
            reward_key: 'mission_2',
          }),
        }),
      );
    });

    it('returns false on non-OK response', async () => {
      document.cookie = 'cp_access_token=tok123';
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
      expect(await claimReward('participant')).toBe(false);
    });

    it('returns false (swallows) on network error', async () => {
      document.cookie = 'cp_access_token=tok123';
      mockFetch.mockRejectedValueOnce(new Error('network'));
      expect(await claimReward('participant')).toBe(false);
    });
  });
});
