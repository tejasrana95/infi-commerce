'use client';

import CookieBanner from './CookieBanner';
import { useStore } from '@/providers/StoreProvider';

export default function CookieConsentWrapper() {
    const { store } = useStore();

    if (!store?.cookieConsentSettings?.enabled) {
        return null;
    }

    return <CookieBanner settings={store.cookieConsentSettings} />;
}
