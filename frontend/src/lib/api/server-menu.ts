// Server-side menu utilities for SSR components
// All menu fetching should use these functions to leverage caching

import { Menu } from '@/types/menu';
import { resolveMenuById } from '@/lib/menu-cache';
import { getCacheOptions } from '@/lib/revalidation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Fetch menu by ID with cache-first strategy
 * Uses three-layer cache: Memory → File → API
 * 
 * @param menuId - MongoDB menu ID
 * @returns Menu object or null if not found
 */
export async function fetchMenuById(menuId: string): Promise<Menu | null> {
    const result = await resolveMenuById(menuId, async (id) => {
        try {
            const res = await fetch(`${API_BASE}/menus/${id}`, {
                ...getCacheOptions('store'),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                if (res.status === 404) {
                    console.warn(`Menu not found: ${id}`);
                    return null;
                }
                throw new Error(`Failed to fetch menu: ${res.status}`);
            }

            const data = await res.json();
            return data.menu || null;
        } catch (error) {
            console.error(`Error fetching menu ${id}:`, error);
            return null;
        }
    });
    return result.menu;
}

/**
 * Fetch multiple menus by their IDs
 * Uses cache for each menu individually
 * 
 * @param menuIds - Array of menu IDs
 * @returns Array of Menu objects (nulls filtered out)
 */
export async function fetchMenusByIds(menuIds: string[]): Promise<Menu[]> {
    const menuPromises = menuIds.map(id => fetchMenuById(id));
    const menus = await Promise.all(menuPromises);
    return menus.filter((menu): menu is Menu => menu !== null);
}

/**
 * Fetch all active menus for a store
 * Note: This bypasses cache as it's a dynamic query
 * Use fetchMenuById for individual menu fetching with cache
 * 
 * @param storeId - Store ID
 * @returns Array of Menu objects
 */
export async function fetchMenusByStoreId(storeId: string): Promise<Menu[]> {
    try {
        const res = await fetch(`${API_BASE}/menus?storeId=${storeId}&isActive=true`, {
            ...getCacheOptions('store'),
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
            console.warn(`Failed to fetch menus for store ${storeId}`);
            return [];
        }

        const data = await res.json();
        return data.menus || [];
    } catch (error) {
        console.error(`Error fetching menus for store ${storeId}:`, error);
        return [];
    }
}

/**
 * Fetch menu by location (header, footer, etc.)
 * Note: This bypasses cache as it's a dynamic query
 * 
 * @param storeId - Store ID
 * @param location - Menu location (header, footer, sidebar, mobile, custom)
 * @returns Menu object or null if not found
 */
export async function fetchMenuByLocation(
    storeId: string,
    location: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom'
): Promise<Menu | null> {
    try {
        const res = await fetch(`${API_BASE}/menus?storeId=${storeId}&location=${location}&isActive=true`, {
            ...getCacheOptions('store'),
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return null;

        const data = await res.json();
        const menus = data.menus || [];
        return menus[0] || null;
    } catch (error) {
        console.error(`Error fetching menu by location ${location}:`, error);
        return null;
    }
}
