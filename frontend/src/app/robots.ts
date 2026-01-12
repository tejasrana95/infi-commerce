import { MetadataRoute } from 'next';
import { getServerStore } from '@/lib/api/server-store';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const store = await getServerStore();
    const domain = (store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002';
    const baseUrl = `https://${domain}`;

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/',
                    '/blog/',
                    '/ai/products.json',
                ],
                disallow: [
                    '/account/',
                    '/cart/',
                    '/checkout/',
                    '/login/',
                    '/register/',
                    '/forgot-password/',
                    '/reset-password/',
                    '/verify-email/',
                    '/api/',
                    '/auth/',
                    '/orders/',
                ],
            },
            {
                userAgent: 'GPTBot',
                allow: [
                    '/',
                    '/',
                    '/ai/products.json',
                    '/.well-known/ai-plugin.json',
                    '/.well-known/llms.txt',
                ],
            },
            {
                userAgent: 'Google-Extended',
                allow: [
                    '/',
                    '/',
                    '/ai/products.json',
                ],
            },
            {
                userAgent: 'CCBot',
                allow: [
                    '/',
                    '/',
                    '/ai/products.json',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
