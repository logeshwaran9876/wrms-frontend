import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';
import type { User, UserRole, LoginPayload } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('wrms_token') : null;
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('wrms_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Initialize or re-verify session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const storedToken = localStorage.getItem('wrms_token');
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      try {
        const freshUser = await authApi.getMe();
        if (isMounted) {
          setUser(freshUser);
          localStorage.setItem('wrms_user', JSON.stringify(freshUser));
        }
      } catch (err) {
        if (isMounted) {
          localStorage.removeItem('wrms_token');
          localStorage.removeItem('wrms_user');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    // Listen to unauthorized event
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('wrms_unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('wrms_unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    localStorage.setItem('wrms_token', res.token);
    localStorage.setItem('wrms_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout().catch(() => {});
    } finally {
      localStorage.removeItem('wrms_token');
      localStorage.removeItem('wrms_user');
      setToken(null);
      setUser(null);
    }
  }, []);

  const isAuthenticated = !!token && !!user;
  const role = user?.role || null;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'super_admin' || role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        role,
        isSuperAdmin,
        isAdmin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
