'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const CookieConsentWrapper = dynamic(() => import('@/components/core/CookieBanner/CookieConsentWrapper'), {
    ssr: false,
});
const OfflineIndicator = dynamic(() => import('@/components/pwa/OfflineIndicator'), {
    ssr: false,
});
const InstallPrompt = dynamic(() => import('@/components/pwa/InstallPrompt'), {
    ssr: false,
});
const PWARegistration = dynamic(() => import('@/components/pwa/PWARegistration'), {
    ssr: false,
});

interface DeferredGlobalWidgetsProps {
    pwaEnabled: boolean;
}

export default function DeferredGlobalWidgets({ pwaEnabled }: DeferredGlobalWidgetsProps) {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let cleanup = () => {};

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            const idleWindow = window as Window & {
                requestIdleCallback: (callback: () => void, options?: { timeout: number }) => number;
                cancelIdleCallback?: (id: number) => void;
            };
            const idleId = idleWindow.requestIdleCallback(() => {
                if (!cancelled) setShouldLoad(true);
            }, { timeout: 1500 });

            cleanup = () => idleWindow.cancelIdleCallback?.(idleId);
        } else {
            const timeoutId = globalThis.setTimeout(() => {
                if (!cancelled) setShouldLoad(true);
            }, 250);

            cleanup = () => globalThis.clearTimeout(timeoutId);
        }

        return () => {
            cancelled = true;
            cleanup();
        };
    }, []);

    if (!shouldLoad) return null;

    return (
        <>
            <CookieConsentWrapper />
            {pwaEnabled && (
                <>
                    <OfflineIndicator />
                    <InstallPrompt />
                    <PWARegistration />
                </>
            )}
        </>
    );
}
