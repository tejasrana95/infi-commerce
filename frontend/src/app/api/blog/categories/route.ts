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
            cache: 'no-store',
        });

        const data = await res.json();
        return NextResponse.json({ success: true, ...data });
    } catch (error) {
        console.error('Error fetching blog categories:', error);
        return NextResponse.json({ success: false, data: [], error: 'Failed to fetch categories' }, { status: 500 });
    }
}
