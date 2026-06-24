import type { PlayhubGroup, GroupMember } from '../types';
import { GAME_TYPE, GAME_MODE } from './api';

const BASE_URL = (import.meta.env.VITE_BASE_URL as string) ?? '';
const USE_MOCK = import.meta.env.VITE_MOCK_API === 'true';

// ── Mock data ──────────────────────────────────────────────

const MOCK_GROUP: PlayhubGroup = {
  id: 1,
  name: 'the boys',
  invite_link: 'YPWFZC',
  members: [
    { group: 1, user: 'you', joined_at: '2026-06-01T00:00:00Z' },
    { group: 1, user: 'Mike', joined_at: '2026-06-02T00:00:00Z' },
    { group: 1, user: 'Sarah', joined_at: '2026-06-03T00:00:00Z' },
    { group: 1, user: 'Jordan', joined_at: '2026-06-04T00:00:00Z' },
    { group: 1, user: 'Alex', joined_at: '2026-06-05T00:00:00Z' },
  ],
};

let mockGroup: PlayhubGroup | null = MOCK_GROUP;

const mock = {
  async fetchGroup(): Promise<PlayhubGroup | null> {
    await delay(300);
    return mockGroup;
  },
  async createGroup(groupName: string): Promise<PlayhubGroup> {
    await delay(400);
    if (groupName.toLowerCase() === 'error') throw new Error('Group name is already taken');
    mockGroup = { ...MOCK_GROUP, name: groupName };
    return mockGroup;
  },
  async joinGroup(inviteCode: string): Promise<GroupMember> {
    await delay(400);
    if (inviteCode === 'ZZZZZZ') throw new Error('Check the code again');
    mockGroup = MOCK_GROUP;
    return MOCK_GROUP.members[0];
  },
  async leaveGroup(): Promise<void> {
    await delay(300);
    mockGroup = null;
  },
  async claimReward(_rewardKey: string): Promise<boolean> {
    await delay(200);
    return true;
  },
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
  async fetchGroup(): Promise<PlayhubGroup | null> {
    const res = await fetch(`${BASE_URL}/playhub/groups/`, { headers: getHeaders() });
    if (res.status === 204) return null;
    if (!res.ok) throw new Error('Failed to fetch group');
    return res.json();
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
    return res.json();
  },
  async joinGroup(inviteCode: string): Promise<GroupMember> {
    const res = await fetch(`${BASE_URL}/playhub/groups/join/?invite=${encodeURIComponent(inviteCode)}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? 'Failed to join group');
    }
    return res.json();
  },
  async leaveGroup(): Promise<void> {
    const res = await fetch(`${BASE_URL}/playhub/groups/`, {
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

export const fetchGroup = api.fetchGroup;
export const createGroup = api.createGroup;
export const joinGroup = api.joinGroup;
export const leaveGroup = api.leaveGroup;
export const claimReward = api.claimReward;
