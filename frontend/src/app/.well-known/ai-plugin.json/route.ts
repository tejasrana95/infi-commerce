import { NextResponse } from 'next/server';
import { getServerStore } from '@/lib/api/server-store';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const store = await getServerStore();
        const domain = (store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002';
        const storeName = store?.name || 'E-Commerce Store';

        const aiPlugin = {
            schema_version: 'v1',
            name_for_human: storeName,
            name_for_model: 'product_search',
            description_for_human: `Browse and search products from ${storeName}.`,
            description_for_model: `Use this plugin to search for products, get product details, check availability, and find prices from ${storeName}. The store sells various products across multiple categories. Use the product feed endpoint to get a complete list of available products.`,
            auth: {
                type: 'none',
            },
            api: {
                type: 'openapi',
                url: `https://${domain}/ai/products.json`,
                is_user_authenticated: false,
            },
            logo_url: store?.logo || `https://${domain}/favicon.ico`,
            contact_email: store?.settings?.contact?.email || 'support@store.com',
            legal_info_url: `https://${domain}/page/terms-of-service`,
        };

        return NextResponse.json(aiPlugin, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            },
        });
    } catch (error) {
        console.error('AI Plugin JSON Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate AI plugin manifest' },
            { status: 500 }
        );
    }
}
