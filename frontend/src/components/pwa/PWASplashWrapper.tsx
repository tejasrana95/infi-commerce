'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { isPWAInstalled, getPWADisplayMode } from '@/lib/pwa/pwa-utils';
import PWASplashScreen from './PWASplashScreen';

/**
 * PWASplashWrapper - Shows a custom splash screen when the PWA is launching
 * This provides a smooth loading experience for installed PWAs
 */
export default function PWASplashWrapper() {
    const { store, isLoading } = useStore();
    const [showSplash, setShowSplash] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Only show custom splash screen:
        // 1. When running as installed PWA (standalone mode)
        // 2. When PWA is enabled with splash screen settings
        // 3. During initial load
        const isStandalone = getPWADisplayMode() === 'standalone' || isPWAInstalled();
        const pwaEnabled = store?.pwaSettings?.enabled;
        const hasSplashConfig = store?.pwaSettings?.splashScreen;

        if (isStandalone && pwaEnabled && hasSplashConfig) {
            setShowSplash(true);

            // Hide splash screen after a minimum display time or when content is loaded
            const minDisplayTime = 1500; // Minimum time to show splash
            const timer = setTimeout(() => {
                setShowSplash(false);
            }, minDisplayTime);

            return () => clearTimeout(timer);
        }
    }, [store]);

    // Hide splash when store is loaded and timer expires
    useEffect(() => {
        if (!isLoading && showSplash) {
            const hideTimer = setTimeout(() => {
                setShowSplash(false);
            }, 500); // Short delay after content loads
            return () => clearTimeout(hideTimer);
        }
    }, [isLoading, showSplash]);

    // Don't render on server or if splash shouldn't show
    if (!mounted || !showSplash || !store?.pwaSettings) {
        return null;
    }

    return (
        <PWASplashScreen
            pwaSettings={store.pwaSettings}
            storeLogo={store.logo}
            storeName={store.pwaSettings.appName || store.name}
        />
    );
}
