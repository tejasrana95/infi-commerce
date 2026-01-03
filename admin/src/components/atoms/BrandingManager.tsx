'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

export default function BrandingManager() {
    const [branding, setBranding] = useState<{ name?: string, favicon?: string } | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const response = await api.get('/settings/admin-branding');
                if (response.data.success) {
                    const data = response.data.branding;
                    setBranding(data);
                }
            } catch (error) {
                console.error('Failed to fetch branding for head:', error);
            }
        };
        fetchBranding();
    }, []);

    useEffect(() => {
        if (branding?.name) {
            const currentTitle = document.title;
            if (currentTitle.includes('Infi Commerce')) {
                document.title = currentTitle.replace('Infi Commerce', branding.name);
            } else if (!currentTitle.includes(branding.name)) {
                // If it doesn't have the branding name and doesn't have "Infi Commerce", 
                // it might be a custom title from a page, but we should still ensure branding if possible.
                // For now, replacing the default is the most requested behavior.
            }
        }

        if (branding?.favicon) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            if (link.href !== branding.favicon) {
                link.href = branding.favicon;
            }
        }
    }, [pathname, branding]);

    return null;
}
