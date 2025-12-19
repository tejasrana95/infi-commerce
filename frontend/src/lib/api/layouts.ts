// Layout API - Fetch layouts from backend

import { Layout } from '@/types/layout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Fetch layout by type (homepage, category, product, etc.)
 */
export async function getLayoutByType(type: string, storeId?: string): Promise<Layout | null> {
    try {
        const params = new URLSearchParams({ type });
        if (storeId) params.append('storeId', storeId);

        const response = await fetch(`${API_BASE_URL}/layouts?${params}`, {
            next: { revalidate: 60 }, // Revalidate every 60 seconds
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch layout: ${response.statusText}`);
        }

        const data = await response.json();
        return data.layout || null;
    } catch (error) {
        console.error('Error fetching layout:', error);
        return null;
    }
}

/**
 * Fetch layout by ID
 */
export async function getLayoutById(id: string): Promise<Layout | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/layouts/${id}`, {
            next: { revalidate: 60 },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch layout: ${response.statusText}`);
        }

        const data = await response.json();
        return data.layout || null;
    } catch (error) {
        console.error('Error fetching layout:', error);
        return null;
    }
}

/**
 * Get default layout for a page type
 */
export async function getDefaultLayout(type: string, storeId?: string): Promise<Layout | null> {
    try {
        const params = new URLSearchParams({ type, default: 'true' });
        if (storeId) params.append('storeId', storeId);

        const response = await fetch(`${API_BASE_URL}/layouts?${params}`, {
            next: { revalidate: 300 }, // Cache default layouts for 5 minutes
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch default layout: ${response.statusText}`);
        }

        const data = await response.json();
        return data.layout || null;
    } catch (error) {
        console.error('Error fetching default layout:', error);
        return null;
    }
}
