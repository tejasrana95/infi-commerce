'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useStore } from './StoreProvider';
import { initGA, pageview, isGAReady } from '@/lib/ga';

// ============================================
// Types
// ============================================

interface AnalyticsConfig {
    enabled: boolean;
    trackingId?: string;
}

interface AnalyticsContextType {
    isEnabled: boolean;
    isReady: boolean;
    trackingId: string | null;
}

// ============================================
// Context
// ============================================

const AnalyticsContext = createContext<AnalyticsContextType>({
    isEnabled: false,
    isReady: false,
    trackingId: null,
});

// ============================================
// Hook
// ============================================

export function useAnalytics(): AnalyticsContextType {
    return useContext(AnalyticsContext);
}

// ============================================
// Provider Component
// ============================================

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const { store } = useStore();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isReady, setIsReady] = useState(false);

    // Get GA config from store settings
    const gaConfig: AnalyticsConfig | undefined = (store as any)?.googleAnalytics;
    const isEnabled = gaConfig?.enabled ?? false;
    const trackingId = gaConfig?.trackingId || null;

    // Initialize GA when config is available
    useEffect(() => {
        if (isEnabled && trackingId) {
            initGA(trackingId);
            setIsReady(true);
        }
    }, [isEnabled, trackingId]);

    // Track page views on route changes
    useEffect(() => {
        if (isReady && isGAReady()) {
            const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
            pageview(url);
        }
    }, [pathname, searchParams, isReady]);

    const value: AnalyticsContextType = {
        isEnabled,
        isReady,
        trackingId,
    };

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
}

export default AnalyticsProvider;
