import type { GroupMember, PlayhubGroup } from '../types';
import { GAME_TYPE, GAME_MODE } from './api';

const BASE_URL = (import.meta.env.VITE_BASE_URL as string) ?? '';
const USE_MOCK = import.meta.env.VITE_MOCK_API === 'true';

// ── Mock data ──────────────────────────────────────────────

const MOCK_GROUPS: PlayhubGroup[] = [{
  id: 1,
  name: 'the boys',
  invite_link: 'YPWFZC',
  members_count: 5,
  members: [
    { group: 1, user: 'you', joined_at: '2026-06-01T00:00:00Z' },
    { group: 1, user: 'Mike', joined_at: '2026-06-02T00:00:00Z' },
    { group: 1, user: 'Sarah', joined_at: '2026-06-03T00:00:00Z' },
    { group: 1, user: 'Jordan', joined_at: '2026-06-04T00:00:00Z' },
    { group: 1, user: 'Alex', joined_at: '2026-06-05T00:00:00Z' },
  ],
}, {
  id: 2,
  name: 'office sickos',
  invite_link: 'OFFICE',
  members_count: 12,
  members: [
    { group: 2, user: 'you', joined_at: '2026-06-01T00:00:00Z' },
    { group: 2, user: 'Riley', joined_at: '2026-06-02T00:00:00Z' },
    { group: 2, user: 'Casey', joined_at: '2026-06-03T00:00:00Z' },
    { group: 2, user: 'Morgan', joined_at: '2026-06-04T00:00:00Z' },
  ],
}, {
  id: 3,
  name: 'group chat legends',
  invite_link: 'LEGEND',
  members_count: 4,
  members: [
    { group: 3, user: 'you', joined_at: '2026-06-01T00:00:00Z' },
    { group: 3, user: 'Sarah', joined_at: '2026-06-02T00:00:00Z' },
    { group: 3, user: 'Devin', joined_at: '2026-06-03T00:00:00Z' },
    { group: 3, user: 'Taylor', joined_at: '2026-06-04T00:00:00Z' },
  ],
}];

let mockGroups: PlayhubGroup[] = [...MOCK_GROUPS];

const mock = {
  async fetchGroups(): Promise<PlayhubGroup[]> {
    await delay(300);
    return mockGroups.map(normalizeGroup);
  },
  async fetchGroup(groupId: number): Promise<PlayhubGroup> {
    await delay(200);
    return normalizeGroup(mockGroups.find((group) => group.id === groupId) ?? MOCK_GROUPS[0]);
  },
  async createGroup(groupName: string): Promise<PlayhubGroup> {
    await delay(400);
    if (groupName.toLowerCase() === 'error') throw new Error('Group name is already taken');
    const id = Date.now();
    const group: PlayhubGroup = {
      id,
      name: groupName,
      invite_link: groupName.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase() || 'MOCK',
      members_count: 1,
      members: [{ group: id, user: 'you', joined_at: new Date().toISOString() }],
    };
    mockGroups = [group, ...mockGroups];
    return normalizeGroup(group);
  },
  async joinGroup(inviteCode: string): Promise<PlayhubGroup> {
    await delay(400);
    if (inviteCode === 'ZZZZZZ') throw new Error('Check the code again');
    const group = MOCK_GROUPS.find((g) => extractInviteCode(g.invite_link) === inviteCode) ?? MOCK_GROUPS[0];
    if (!mockGroups.some((existingGroup) => existingGroup.id === group.id)) {
      mockGroups = [group, ...mockGroups];
    }
    return normalizeGroup(group);
  },
  async leaveGroup(groupId: number): Promise<void> {
    await delay(300);
    mockGroups = mockGroups.filter((group) => group.id !== groupId);
  },
  async claimReward(rewardKey: string): Promise<boolean> {
    void rewardKey;
    await delay(200);
    return true;
  },
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type RawGroupMember = GroupMember | {
  group?: number;
  user_id?: number;
  username?: string | null;
  joined_at: string;
};

type RawPlayhubGroup = Omit<PlayhubGroup, 'members'> & {
  members?: RawGroupMember[];
};

function normalizeMember(groupId: number, member: RawGroupMember): GroupMember {
  if ('user' in member) {
    return {
      ...member,
      group: member.group ?? groupId,
    };
  }

  const username = member.username?.trim() || 'Player';
  return {
    group: member.group ?? groupId,
    user: typeof member.user_id === 'number'
      ? { id: member.user_id, username }
      : username,
    joined_at: member.joined_at,
  };
}

function normalizeGroup(group: RawPlayhubGroup): PlayhubGroup {
  return {
    ...group,
    members: Array.isArray(group.members)
      ? group.members.map((member) => normalizeMember(group.id, member))
      : [],
  };
}

function extractInviteCode(inviteLink: string): string {
  const match = inviteLink.match(/invite=([A-Za-z0-9]+)/);
  if (match) return match[1];
  return inviteLink.replace(/[^A-Za-z0-9]/g, '');
}

// ── Real API ───────────────────────────────────────────────

function getAccessToken(): string | null {
  const cookies = document.cookie.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith('cp_access_token=')) return cookie.slice('cp_access_token='.length);
    if (cookie.startsWith('sbc_access_token=')) return cookie.slice('sbc_access_token='.length);
  }
  return null;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Token ${token}`;
  return headers;
}

const real = {
  async fetchGroups(): Promise<PlayhubGroup[]> {
    const res = await fetch(`${BASE_URL}/playhub/groups/`, { headers: getHeaders() });
    if (res.status === 204) return [];
    if (!res.ok) throw new Error('Failed to fetch group');
    const body = await res.json();
    if (Array.isArray(body.groups)) return body.groups.map((group: RawPlayhubGroup) => normalizeGroup(group));
    if (body && typeof body === 'object' && typeof body.id === 'number') return [normalizeGroup(body as RawPlayhubGroup)];
    return [];
  },
  async fetchGroup(groupId: number): Promise<PlayhubGroup> {
    const res = await fetch(`${BASE_URL}/playhub/groups/${groupId}/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch group');
    return normalizeGroup(await res.json());
  },
  async createGroup(groupName: string): Promise<PlayhubGroup> {
    const res = await fetch(`${BASE_URL}/playhub/groups/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ group_name: groupName }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? 'Failed to create group');
    }
    return normalizeGroup(await res.json());
  },
  async joinGroup(inviteCode: string): Promise<PlayhubGroup> {
    const res = await fetch(`${BASE_URL}/playhub/groups/join/?invite=${encodeURIComponent(inviteCode)}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? 'Failed to join group');
    }
    return normalizeGroup(await res.json());
  },
  async leaveGroup(groupId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/playhub/groups/${groupId}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to leave group');
  },
  async claimReward(rewardKey: string): Promise<boolean> {
    if (!getAccessToken()) return false;
    try {
      const res = await fetch(`${BASE_URL}/playhub/claim/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          game_type: GAME_TYPE,
          game_mode: GAME_MODE,
          reward_key: rewardKey,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

// ── Exports ────────────────────────────────────────────────

const api = USE_MOCK ? mock : real;

export const fetchGroups = api.fetchGroups;
export const fetchGroup = api.fetchGroup;
export const createGroup = api.createGroup;
export const joinGroup = api.joinGroup;
export const leaveGroup = api.leaveGroup;
export const claimReward = api.claimReward;
