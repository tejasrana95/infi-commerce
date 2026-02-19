import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id') || '';

    try {
        const res = await fetch(`${API_URL}/blog/categories`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Store-ID': storeId,
            },
            next: { revalidate: 300 },
        });

        const data = await res.json();
        return NextResponse.json(
            { success: true, ...data },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                },
            }
        );
    } catch (error) {
        console.error('Error fetching blog categories:', error);
        return NextResponse.json({ success: false, data: [], error: 'Failed to fetch categories' }, { status: 500 });
    }
}
