/**
 * Prebuild script: Fetches menu configs and writes to cache file
 * Run before `next build` via npm prebuild hook
 */

import fs from 'fs';
import path from 'path';
import { loadEnvConfig } from '@next/env';

// Load environment variables from .env files
loadEnvConfig(process.cwd());

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const STORE_DOMAIN_MAP = process.env.STORE_DOMAIN_MAP;
const OUTPUT_PATH = path.join(process.cwd(), '.next/cache/menu-config.json');

interface MenuConfig {
    menuId: string;
    generatedAt: string;
    menuData: Record<string, any>;
}

interface MenuProduct {
    _id: string;
    name: string;
    slug?: string;
    price?: number;
    salePrice?: number;
    featuredImage?: string;
    images?: string[];
    rating?: number;
    reviewCount?: number;
}

async function fetchMenusForStore(storeId: string): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/menus?storeId=${storeId}&isActive=true`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.menus || [];
    } catch (error) {
        console.error(`Failed to fetch menus for store ${storeId}:`, error);
        return [];
    }
}

async function fetchProductsForCategory(
    storeId: string,
    categoryId: string,
    limit: number
): Promise<MenuProduct[]> {
    try {
        const params = new URLSearchParams({
            storeId,
            categoryId,
            isActive: 'true',
            limit: String(limit),
            view: 'listing',
        });

        const res = await fetch(`${API_BASE}/products?${params.toString()}`);
        if (!res.ok) return [];
        const data = await res.json();
        const products = data.products || data.data || [];

        return products.map((p: any) => ({
            _id: String(p._id),
            name: p.name,
            slug: p.slug,
            price: p.price,
            salePrice: p.salePrice,
            featuredImage: p.featuredImage,
            images: p.images,
            rating: p.rating ?? p.averageRating,
            reviewCount: p.reviewCount,
        }));
    } catch (error) {
        console.error(`Failed to fetch category products for ${categoryId}:`, error);
        return [];
    }
}

async function fetchProductById(productId: string): Promise<MenuProduct | null> {
    try {
        const res = await fetch(`${API_BASE}/products/${productId}`);
        if (!res.ok) return null;
        const data = await res.json();
        const p = data.product || data.data?.product || data.data || null;
        if (!p) return null;

        return {
            _id: String(p._id),
            name: p.name,
            slug: p.slug,
            price: p.price,
            salePrice: p.salePrice,
            featuredImage: p.featuredImage,
            images: p.images,
            rating: p.rating ?? p.averageRating,
            reviewCount: p.reviewCount,
        };
    } catch (error) {
        console.error(`Failed to fetch product ${productId}:`, error);
        return null;
    }
}

async function enrichMenuItemsWithProducts(
    items: any[],
    storeId: string,
    categoryProductsCache: Map<string, MenuProduct[]>,
    productCache: Map<string, MenuProduct | null>
): Promise<any[]> {
    if (!Array.isArray(items) || items.length === 0) return items || [];

    return Promise.all(
        items.map(async (item: any) => {
            const enriched = { ...item };

            const categoryId = enriched.categoryId ? String(enriched.categoryId) : '';
            const productLimit = Number(enriched.productLimit || 10);
            const autoAddProducts = enriched.autoAddProducts !== false;
            const hasInlineProducts = Array.isArray(enriched.products) && enriched.products.length > 0;

            // Auto-populate category products for top-level/nested category items.
            if (
                enriched.type === 'category' &&
                categoryId &&
                autoAddProducts &&
                !hasInlineProducts
            ) {
                const cacheKey = `${storeId}:${categoryId}:${productLimit}`;
                if (!categoryProductsCache.has(cacheKey)) {
                    categoryProductsCache.set(
                        cacheKey,
                        await fetchProductsForCategory(storeId, categoryId, productLimit)
                    );
                }
                enriched.products = categoryProductsCache.get(cacheKey) || [];
            }

            // Resolve individual product references once to avoid runtime fetches.
            if (
                enriched.type === 'product' &&
                enriched.productId &&
                (!Array.isArray(enriched.products) || enriched.products.length === 0)
            ) {
                const productId = String(enriched.productId);
                if (!productCache.has(productId)) {
                    productCache.set(productId, await fetchProductById(productId));
                }
                const resolvedProduct = productCache.get(productId);
                enriched.products = resolvedProduct ? [resolvedProduct] : [];
            }

            if (Array.isArray(enriched.children) && enriched.children.length > 0) {
                enriched.children = await enrichMenuItemsWithProducts(
                    enriched.children,
                    storeId,
                    categoryProductsCache,
                    productCache
                );
            }

            if (enriched.megaMenu?.sections?.length) {
                enriched.megaMenu = {
                    ...enriched.megaMenu,
                    sections: await Promise.all(
                        enriched.megaMenu.sections.map(async (section: any) => ({
                            ...section,
                            columns: await Promise.all(
                                (section.columns || []).map(async (column: any) => ({
                                    ...column,
                                    items: await enrichMenuItemsWithProducts(
                                        column.items || [],
                                        storeId,
                                        categoryProductsCache,
                                        productCache
                                    ),
                                }))
                            ),
                        }))
                    ),
                };
            }

            return enriched;
        })
    );
}

async function main() {
    if (!STORE_DOMAIN_MAP) {
        console.log('STORE_DOMAIN_MAP not configured, skipping menu cache generation');
        return;
    }

    let rawMap: Record<string, string | string[]>;
    try {
        rawMap = JSON.parse(STORE_DOMAIN_MAP);
    } catch (error) {
        console.error('Failed to parse STORE_DOMAIN_MAP:', error);
        return;
    }

    // Extract unique store IDs
    const storeIds = new Set<string>();
    for (const [key, value] of Object.entries(rawMap)) {
        if (Array.isArray(value)) {
            // Format: "storeId": ["domain1", "domain2"]
            storeIds.add(key);
        } else {
            // Format: "domain": "storeId"
            storeIds.add(value);
        }
    }

    const generatedAt = new Date().toISOString();
    const configs: Record<string, MenuConfig> = {};

    // Fetch menus for each store
    for (const storeId of storeIds) {
        console.log(`Fetching menus for store ${storeId}...`);
        const menus = await fetchMenusForStore(storeId);
        const categoryProductsCache = new Map<string, MenuProduct[]>();
        const productCache = new Map<string, MenuProduct | null>();

        // Add each menu to the cache
        for (const rawMenu of menus) {
            const menu = {
                ...rawMenu,
                items: await enrichMenuItemsWithProducts(
                    rawMenu.items || [],
                    storeId,
                    categoryProductsCache,
                    productCache
                ),
            };
            const menuId = menu._id.toString();
            configs[menuId] = {
                menuId,
                generatedAt,
                menuData: menu,
            };
        }

        console.log(`  Cached ${menus.length} menu(s)`);
    }

    // Ensure directory exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(configs, null, 2));
    console.log(`\n✓ Menu configs written to ${OUTPUT_PATH}`);
    console.log(`  Total menus cached: ${Object.keys(configs).length}`);
}

main();
