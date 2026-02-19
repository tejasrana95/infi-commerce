import { MetadataRoute } from 'next';
import { getServerStore } from '@/lib/api/server-store';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const store = await getServerStore();
    const headersList = await headers();
    const requestHost = headersList.get('host');
    const domain = requestHost || ((store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002');
    const baseUrl = `https://${domain}`;

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/blog/',
                    '/products',
                    '/ai/products.json',
                    '/.well-known/llms.txt',
                ],
                disallow: [
                    '/account',
                    '/cart',
                    '/checkout',
                    '/login',
                    '/register',
                    '/forgot-password',
                    '/reset-password',
                    '/verify-email',
                    '/api',
                    '/auth',
                    '/orders',
                ],
            },
            {
                userAgent: 'GPTBot',
                allow: [
                    '/',
                    '/ai/products.json',
                    '/.well-known/llms.txt',
                    '/sitemap.xml',
                ],
            },
            {
                userAgent: 'Google-Extended',
                allow: [
                    '/',
                    '/ai/products.json',
                    '/sitemap.xml',
                ],
            },
            {
                userAgent: 'CCBot',
                allow: [
                    '/',
                    '/ai/products.json',
                    '/sitemap.xml',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
