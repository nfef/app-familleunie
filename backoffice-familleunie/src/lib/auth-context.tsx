import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { type AuthUser, getMe, getToken, login as apiLogin, logout as apiLogout, removeToken } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (loginValue: string, password: string) => {
    const res = await apiLogin({ login: loginValue, password });
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => undefined);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (roles: string[]) => !!user && roles.some((r) => user.roles.includes(r)),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
