'use client';

import { useEffect } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { registerServiceWorker, unregisterServiceWorker } from '@/lib/pwa/pwa-utils';

export default function PWARegistration() {
    const { store } = useStore();

    useEffect(() => {
        if (!store) return;

        if (store.pwaSettings?.enabled) {
            // Register service worker
            registerServiceWorker();
        } else {
            // Unregister if PWA is disabled
            unregisterServiceWorker();
        }
    }, [store]);

    return null; // This component doesn't render anything
}
