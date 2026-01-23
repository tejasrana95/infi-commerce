'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './UserContext';
import { useStore } from './StoreContext';
import { useSessionStore } from '@/store/sessionStore';
import { User } from '@/types';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    loading: boolean;
    login: (token: string, user: User, storeId: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { setUser, clearUser } = useUser();
    const { clearStore } = useStore();

    // Load token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('pos_auth_token');
        if (storedToken) {
            setToken(storedToken);
        }
        setLoading(false);
    }, []);

    const login = useCallback((newToken: string, user: User, storeId: string) => {
        // Save token
        localStorage.setItem('pos_auth_token', newToken);
        setToken(newToken);

        // Save user
        setUser(user);
        localStorage.setItem('pos_user', JSON.stringify(user));

        // Save store ID
        localStorage.setItem('pos_store_id', storeId);
    }, [setUser]);

    const logout = useCallback(() => {
        // Clear all auth data
        localStorage.removeItem('pos_auth_token');
        localStorage.removeItem('pos_user');
        localStorage.removeItem('pos_store_id');

        // Clear context states
        setToken(null);
        clearUser();
        clearStore();

        // Clear session store
        useSessionStore.getState().logout();

        // Redirect to login
        router.push('/login');
    }, [clearUser, clearStore, router]);

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ isAuthenticated, token, loading, login, logout }}>
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
