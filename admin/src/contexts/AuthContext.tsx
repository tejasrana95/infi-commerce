'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean; mfaToken?: string }>;
  verify2FA: (mfaToken: string, code: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accesstoken');
    const savedUser = localStorage.getItem('adminUser');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('adminUser');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/admin/login', { email, password });

      if (response.data.mfaRequired) {
        return { mfaRequired: true, mfaToken: response.data.mfaToken };
      }

      const { accessToken, user, refreshToken } = response.data;
      localStorage.setItem('accesstoken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('adminUser', JSON.stringify(user));
      setUser(user);

      router.push('/dashboard');
      return { mfaRequired: false };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }, [router]);

  const verify2FA = useCallback(async (mfaToken: string, code: string) => {
    try {
      const response = await api.post('/auth/admin/2fa/verify-login', { mfaToken, code });
      const { accessToken, user, refreshToken } = response.data;

      localStorage.setItem('accesstoken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('adminUser', JSON.stringify(user));
      setUser(user);

      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '2FA Verification failed');
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('accesstoken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/admin/me');
      const { user } = response.data;
      localStorage.setItem('adminUser', JSON.stringify(user));
      setUser(user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    verify2FA,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  }), [user, loading, login, verify2FA, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
