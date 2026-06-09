import type { AuthUser } from '../types/auth';

const BASE_URL = (import.meta.env.VITE_BASE_URL as string) ?? '';
const COOKIE_NAME = 'cp_access_token';

// ── Cookie helpers ────────────────────────────────────────

export function getAccessToken(): string | null {
  const cookies = document.cookie.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${COOKIE_NAME}=`)) {
      return cookie.slice(COOKIE_NAME.length + 1);
    }
  }
  return null;
}

export function setAccessToken(token: string): void {
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
}

export function clearAccessToken(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

// ── API calls ─────────────────────────────────────────────

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Token ${token}`;
  return headers;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.detail ?? 'Authentication failed';
  } catch {
    return 'Authentication failed';
  }
}

export async function loginWithGoogle(credential: string): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/user/auth/google/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function loginWithEmail(email: string, redirectUri: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/user/auth/email/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, redirect_uri: redirectUri, app: 'rewind' }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function fetchProfile(): Promise<AuthUser | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE_URL}/user/profile/`, {
      headers: authHeaders(token),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
