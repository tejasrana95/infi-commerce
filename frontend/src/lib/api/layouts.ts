import { Layout } from '@/types/layout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

        const response = await fetch(`${API_BASE}/layouts?${params}`, {
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) return null;
        const result = await response.json();

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
        const response = await fetch(`${API_BASE}/layouts/${id}`, {
            next: { revalidate: 300 }
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.layout || data;
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

        const response = await fetch(`${API_BASE}/layouts?${params}`, {
            next: { revalidate: 300 }
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data.layout || null;
    } catch (error) {
        console.error('Error fetching default layout:', error);
        return null;
    }
}
