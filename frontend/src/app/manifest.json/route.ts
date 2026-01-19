import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Get domain from request
        const host = request.headers.get('host') || 'localhost:3000';
        const store = await getStore(host);

        // If PWA is not enabled or store not found, return empty manifest
        if (!store || !store.pwaSettings?.enabled) {
            return NextResponse.json({}, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=300',
                },
            });
        }

        const { pwaSettings } = store;

        // Build icons array
        const icons = [
            ...(pwaSettings.icons?.icon192
                ? [{
                    src: pwaSettings.icons.icon192,
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any maskable',
                }]
                : []),
            ...(pwaSettings.icons?.icon512
                ? [{
                    src: pwaSettings.icons.icon512,
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any maskable',
                }]
                : []),
        ];

        // Build screenshots array for richer install experience
        const screenshots = pwaSettings.splashScreen?.image
            ? [{
                src: pwaSettings.splashScreen.image,
                sizes: '2732x2732',
                type: 'image/png',
                form_factor: 'wide',
                label: `${pwaSettings.appName || store.name} - Welcome`,
            }]
            : [];

        // Build manifest
        const manifest = {
            name: pwaSettings.appName || store.name,
            short_name: pwaSettings.appShortName || store.name.slice(0, 12),
            description: store.description || `${store.name} - Your shopping destination`,
            start_url: '/',
            scope: '/',
            display: 'standalone',
            background_color: pwaSettings.backgroundColor || '#ffffff',
            theme_color: pwaSettings.themeColor || store.theme?.colors?.primary || '#000000',
            orientation: 'portrait-primary',
            icons,
            ...(screenshots.length > 0 && { screenshots }),
            categories: ['shopping', 'lifestyle'],
            shortcuts: [
                {
                    name: 'Shop',
                    short_name: 'Shop',
                    description: 'Browse products',
                    url: '/products',
                    icons: pwaSettings.icons?.icon192 ? [{
                        src: pwaSettings.icons.icon192,
                        sizes: '192x192',
                    }] : [],
                },
                {
                    name: 'Cart',
                    short_name: 'Cart',
                    description: 'View cart',
                    url: '/cart',
                    icons: pwaSettings.icons?.icon192 ? [{
                        src: pwaSettings.icons.icon192,
                        sizes: '192x192',
                    }] : [],
                },
            ],
        };

        return NextResponse.json(manifest, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
        });
    } catch (error) {
        console.error('Error generating manifest:', error);
        return NextResponse.json({}, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}

