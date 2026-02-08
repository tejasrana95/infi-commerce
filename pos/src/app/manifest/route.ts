import { NextResponse } from 'next/server';

// Default manifest when no settings are available
const defaultManifest = {
    name: 'POS System',
    short_name: 'POS',
    description: 'Point of Sale System',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0f23',
    theme_color: '#1a1a2e',
    orientation: 'any',
    icons: [
        {
            src: '/favicon.ico',
            sizes: '48x48',
            type: 'image/x-icon',
        },
    ],
};

export async function GET() {
    try {
        // Get global POS PWA settings from API
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const response = await fetch(`${backendUrl}/settings/pos-pwa`, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json(defaultManifest, {
                headers: {
                    'Content-Type': 'application/manifest+json',
                },
            });
        }

        const data = await response.json();
        const posPwaSettings = data.settings;

        if (!posPwaSettings?.enabled) {
            return NextResponse.json(defaultManifest, {
                headers: {
                    'Content-Type': 'application/manifest+json',
                },
            });
        }

        // Build icons array
        const icons = [];

        if (posPwaSettings.icons?.icon192) {
            icons.push({
                src: posPwaSettings.icons.icon192,
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable',
            });
        }

        if (posPwaSettings.icons?.icon512) {
            icons.push({
                src: posPwaSettings.icons.icon512,
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable',
            });
        }

        if (posPwaSettings.icons?.appleTouchIcon) {
            icons.push({
                src: posPwaSettings.icons.appleTouchIcon,
                sizes: '180x180',
                type: 'image/png',
            });
        }

        // Fallback to default icons if none provided
        if (icons.length === 0) {
            icons.push({
                src: '/favicon.ico',
                sizes: '48x48',
                type: 'image/x-icon',
            });
        }

        const manifest = {
            name: posPwaSettings.appName || 'POS System',
            short_name: posPwaSettings.appShortName || 'POS',
            description: 'Point of Sale System',
            start_url: '/',
            display: 'standalone',
            background_color: posPwaSettings.backgroundColor || '#0f0f23',
            theme_color: posPwaSettings.themeColor || '#1a1a2e',
            orientation: 'any',
            icons,
            categories: ['business', 'productivity'],
            shortcuts: [
                {
                    name: 'New Sale',
                    short_name: 'Sale',
                    description: 'Start a new sale',
                    url: '/',
                    icons: icons.length > 0 ? [icons[0]] : undefined,
                },
            ],
        };

        return NextResponse.json(manifest, {
            headers: {
                'Content-Type': 'application/manifest+json',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Error generating manifest:', error);
        return NextResponse.json(defaultManifest, {
            headers: {
                'Content-Type': 'application/manifest+json',
            },
        });
    }
}
