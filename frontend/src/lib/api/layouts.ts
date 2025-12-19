// Layout API - Fetch layouts from backend

import { Layout } from '@/types/layout';
import api from '@/lib/api';

/**
 * Fetch layout by type (homepage, category, product, etc.)
 * @param type - Layout type (homepage, category, product, etc.)
 * @param storeId - Required store ID
 */
export async function getLayoutByType(type: string, storeId: string): Promise<Layout | null> {
    try {
        const params = new URLSearchParams({
            type,
            storeId
        });

        const result = await api.get<{ data: Layout[] }>(`layouts?${params}`);

        // API returns { data: [...] }, get the first layout from the array
        return result.data && result.data.length > 0 ? result.data[0] : null;
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
        const data = await api.get<{ layout: Layout }>(`layouts/${id}`);
        return data.layout || null;
    } catch (error) {
        console.error('Error fetching layout:', error);
        return null;
    }
}

/**
 * Get default layout for a page type
 * @param type - Layout type
 * @param storeId - Required store ID
 */
export async function getDefaultLayout(type: string, storeId: string): Promise<Layout | null> {
    try {
        const params = new URLSearchParams({
            type,
            storeId,
            default: 'true'
        });

        const data = await api.get<{ layout: Layout }>(`layouts?${params}`);
        return data.layout || null;
    } catch (error) {
        console.error('Error fetching default layout:', error);
        return null;
    }
}
