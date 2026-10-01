'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useStore } from './StoreProvider';
import { runAfterLoadAndIdle } from '@/lib/defer';
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

    // Initialize GA only after the page has fully loaded and the browser is
    // idle. The gtag.js download + execution is pure main-thread cost and was
    // a direct TBT/LCP contributor when it ran during hydration.
    useEffect(() => {
        if (!isEnabled || !trackingId) return;

        let cancelled = false;
        const cancel = runAfterLoadAndIdle(() => {
            if (cancelled) return;
            initGA(trackingId);
            setIsReady(true);
        });

        return () => {
            cancelled = true;
            cancel();
        };
    }, [isEnabled, trackingId]);

    // Track page views on route changes
    const searchParamsString = searchParams.toString();
    useEffect(() => {
        if (isReady && isGAReady()) {
            const url = pathname + (searchParamsString ? `?${searchParamsString}` : '');
            pageview(url);
        }
    }, [pathname, searchParamsString, isReady]);

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

const MemoizedAnalyticsProvider = React.memo(AnalyticsProvider);
MemoizedAnalyticsProvider.displayName = 'AnalyticsProvider';

export default MemoizedAnalyticsProvider;
