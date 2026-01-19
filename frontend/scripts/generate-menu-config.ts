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

        // Add each menu to the cache
        for (const menu of menus) {
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
