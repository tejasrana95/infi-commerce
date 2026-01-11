import { NextRequest, NextResponse } from 'next/server';
import { getServerStore } from '@/lib/api/server-store';

const INDEXNOW_ENDPOINTS = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
];

// Generate a random key for IndexNow (should be stored in env in production)
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'infi-commerce-indexnow-key';

interface IndexNowRequest {
    urls: string[];
}

export async function POST(request: NextRequest) {
    try {
        const body: IndexNowRequest = await request.json();
        const { urls } = body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json(
                { error: 'urls array is required' },
                { status: 400 }
            );
        }

        if (urls.length > 10000) {
            return NextResponse.json(
                { error: 'Maximum 10000 URLs per request' },
                { status: 400 }
            );
        }

        const store = await getServerStore();
        const domain = (store?.domains && store.domains.length > 0) ? store.domains[0] : 'localhost:3002';
        const host = domain.replace(/:\d+$/, ''); // Remove port for IndexNow

        // IndexNow payload
        const payload = {
            host,
            key: INDEXNOW_KEY,
            keyLocation: `https://${domain}/${INDEXNOW_KEY}.txt`,
            urlList: urls,
        };

        // Submit to all IndexNow endpoints
        const results = await Promise.allSettled(
            INDEXNOW_ENDPOINTS.map(async (endpoint) => {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                return {
                    endpoint,
                    status: response.status,
                    ok: response.ok,
                };
            })
        );

        const successfulSubmissions = results.filter(
            (r) => r.status === 'fulfilled' && r.value.ok
        ).length;

        return NextResponse.json({
            success: true,
            message: `Submitted ${urls.length} URLs to ${successfulSubmissions}/${INDEXNOW_ENDPOINTS.length} endpoints`,
            urlsSubmitted: urls.length,
            results: results.map((r) =>
                r.status === 'fulfilled'
                    ? { ...r.value }
                    : { error: 'Failed to submit' }
            ),
        });
    } catch (error) {
        console.error('IndexNow Error:', error);
        return NextResponse.json(
            { error: 'Failed to submit to IndexNow' },
            { status: 500 }
        );
    }
}

// GET endpoint to verify key
export async function GET() {
    return new NextResponse(INDEXNOW_KEY, {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
