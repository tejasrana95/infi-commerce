import api from '@/lib/api';
import { Menu, MenuItem } from '@/types/menu';

/**
 * Fetch and enrich menus for server-side rendering
 * Fetches the menu structure and pre-loads dynamic content (like category products)
 */
export async function getEnrichedMenus(headerConfig: any, storeId: string): Promise<Record<string, Menu>> {
    const menus: Record<string, Menu> = {};
    const menuIds = new Set<string>();

    // 1. Identify all menu IDs needed from header config
    // Scan direct menu elements form main sections
    const sections = headerConfig?.main?.sections || headerConfig?.sections;
    if (sections) {
        sections.forEach((section: any) => {
            section.items.forEach((item: any) => {
                if (item.type === 'menu' && item.menuId) {
                    menuIds.add(item.menuId);
                }
            });
        });
    }

    // Also checking for mobile menu
    if (headerConfig?.mobileMenu) {
        const mobileId = headerConfig.mobileMenu.menuId || headerConfig.mobileMenu._id;
        if (mobileId) {
            menuIds.add(mobileId);
        }
    }

    // 2. Fetch all menus in parallel
    const menuPromises = Array.from(menuIds).map(async (id) => {
        try {
            const data = await api.get<{ menu: Menu }>(`/menus/${id}?storeId=${storeId}`);
            if (data?.menu) {
                // Enrich the menu with dynamic data (products)
                const enrichedMenu = await enrichMenu(data.menu, storeId);
                return { id, menu: enrichedMenu };
            }
        } catch (error) {
            console.error(`Failed to fetch menu ${id}:`, error);
        }
        return null;
    });

    const results = await Promise.all(menuPromises);

    // 3. Map results
    results.forEach((result) => {
        if (result) {
            menus[result.id] = result.menu;
        }
    });

    return menus;
}

/**
 * Recursively enrich menu items with dynamic data
 */
async function enrichMenu(menu: Menu, storeId: string): Promise<Menu> {
    if (!menu.items) return menu;

    const enrichedItems = await Promise.all(
        menu.items.map(item => enrichMenuItem(item, storeId))
    );

    return { ...menu, items: enrichedItems };
}

/**
 * Enrich a single menu item
 */
async function enrichMenuItem(item: MenuItem, storeId: string): Promise<MenuItem> {
    const newItem = { ...item };

    // Enrichment logic for Category items with product limit
    if (newItem.type === 'category' && newItem.categoryId && newItem.productLimit && newItem.productLimit > 0) {
        try {
            const queryParams = new URLSearchParams({
                categoryId: newItem.categoryId,
                limit: String(newItem.productLimit),
                storeId: storeId
            });

            const response = await api.get<{ products: any[] }>(`/products?${queryParams.toString()}`);
            const products = response.products || (response as any).data || [];

            // Store enriched products in the item
            newItem.products = products.map((p: any) => ({
                _id: p._id,
                name: p.name,
                slug: p.slug,
                // Add other fields if needed for display (price, image)
                price: p.price,
                salePrice: p.salePrice,
                images: p.images
            }));

        } catch (error) {
            console.error(`Failed to enrich category item ${newItem.label}:`, error);
        }
    }

    // Recursively enrich children
    if (newItem.children && newItem.children.length > 0) {
        newItem.children = await Promise.all(
            newItem.children.map(child => enrichMenuItem(child, storeId))
        );
    }

    // Recursively enrich Mega Menu sections
    if (newItem.megaMenu?.sections) {
        newItem.megaMenu.sections = await Promise.all(
            newItem.megaMenu.sections.map(async (section) => ({
                ...section,
                columns: await Promise.all(
                    section.columns.map(async (column) => ({
                        ...column,
                        items: await Promise.all(
                            column.items.map(subItem => enrichMenuItem(subItem, storeId))
                        )
                    }))
                )
            }))
        );
    }

    return newItem;
}
