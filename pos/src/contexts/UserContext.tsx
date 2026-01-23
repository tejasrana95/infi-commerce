'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    clearUser: () => void;
    loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial load from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('pos_user');
        if (storedUser) {
            try {
                setUserState(JSON.parse(storedUser));
            } catch (err) {
                console.error('Failed to parse stored user:', err);
            }
        }
        setLoading(false);
    }, []);

    const setUser = (newUser: User | null) => {
        setUserState(newUser);
        if (newUser) {
            localStorage.setItem('pos_user', JSON.stringify(newUser));
        } else {
            localStorage.removeItem('pos_user');
        }
    };

    const clearUser = () => {
        setUserState(null);
        localStorage.removeItem('pos_user');
    };

    return (
        <UserContext.Provider value={{ user, setUser, clearUser, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
