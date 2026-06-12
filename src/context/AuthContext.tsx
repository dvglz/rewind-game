import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types/auth';
import { fetchProfile, setAccessToken as storeToken, clearAccessToken } from '../lib/auth';
import { clearAllGameStates } from '../engine/storage';
import { clearScoreSyncState } from '../lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile()
      .then((u) => setUserState(u))
      .finally(() => setLoading(false));
  }, []);

  const setUser = useCallback((u: AuthUser) => {
    storeToken(u.accessToken);
    setUserState(u);
  }, []);

  const signOut = useCallback(() => {
    clearAccessToken();
    clearAllGameStates();
    clearScoreSyncState();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: user !== null, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
