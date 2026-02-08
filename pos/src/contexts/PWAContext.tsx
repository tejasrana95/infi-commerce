'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface POSPWASettings {
    enabled: boolean;
    appName?: string;
    appShortName?: string;
    themeColor?: string;
    backgroundColor?: string;
    icons?: {
        icon192?: string;
        icon512?: string;
        appleTouchIcon?: string;
    };
    offlineSettings?: {
        cacheTTL?: number;
        precacheProducts?: boolean;
        offlineMessage?: string;
    };
    installPromptStyle?: 'toast' | 'banner' | 'none';
}

interface PWAContextType {
    settings: POSPWASettings | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<POSPWASettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/settings/pos-pwa`);

            if (!response.ok) {
                throw new Error('Failed to fetch PWA settings');
            }

            const data = await response.json();
            setSettings(data.settings);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            // Set default settings on error
            setSettings({
                enabled: false,
                appName: 'POS System',
                appShortName: 'POS',
                themeColor: '#1a1a2e',
                backgroundColor: '#0f0f23',
                icons: {},
                offlineSettings: {
                    cacheTTL: 24,
                    precacheProducts: false,
                    offlineMessage: 'You are currently offline.',
                },
                installPromptStyle: 'toast',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <PWAContext.Provider value={{ settings, loading, error, refetch: fetchSettings }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
}
