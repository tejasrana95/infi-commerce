'use client';

import { useEffect } from 'react';
import { usePWA } from '@/contexts/PWAContext';
import { registerServiceWorker, unregisterServiceWorker } from '@/lib/pwa/pwa-utils';

export default function PWARegistration() {
    const { settings } = usePWA();

    useEffect(() => {
        if (!settings) return;

        if (settings.enabled) {
            // Register service worker
            registerServiceWorker();
        } else {
            // Unregister if PWA is disabled
            unregisterServiceWorker();
        }
    }, [settings]);

    return null; // This component doesn't render anything
}
