/**
 * Prebuild script: Fetches store configs and writes to cache file
 * Run before `next build` via npm prebuild hook
 */

import fs from 'fs';
import path from 'path';
import { loadEnvConfig } from '@next/env';

// Load environment variables from .env files
loadEnvConfig(process.cwd());

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const STORE_DOMAIN_MAP = process.env.STORE_DOMAIN_MAP;
const OUTPUT_PATH = path.join(process.cwd(), '.next/cache/store-config.json');

// Sensitive fields to exclude from cached config
const SENSITIVE_PATHS = [
    'settings.aiSettings.openaiKey',
    'settings.aiSettings.model',
    'settings.emailSettings',
    'settings.smsSettings',
    'settings.whatsappSettings',
];

interface StoreConfig {
    storeId: string;
    generatedAt: string;
    storeData: Record<string, any>;
}

function removeSensitiveFields(obj: any): any {
    const clone = JSON.parse(JSON.stringify(obj));

    for (const path of SENSITIVE_PATHS) {
        const parts = path.split('.');
        let current = clone;
        for (let i = 0; i < parts.length - 1; i++) {
            if (current[parts[i]]) {
                current = current[parts[i]];
            } else {
                break;
            }
        }
        if (current && parts[parts.length - 1] in current) {
            delete current[parts[parts.length - 1]];
        }
    }

    return clone;
}

/**
 * Fetch store by domain - this returns the full store with embedded menus
 */
async function fetchStoreByDomain(domain: string): Promise<any | null> {
    try {
        const res = await fetch(`${API_BASE}/stores/domain/${encodeURIComponent(domain)}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error(`Failed to fetch store for domain ${domain}:`, error);
        return null;
    }
}

async function main() {
    if (!STORE_DOMAIN_MAP) {
        return;
    }

    let rawMap: Record<string, string | string[]>;
    try {
        rawMap = JSON.parse(STORE_DOMAIN_MAP);
    } catch (error) {
        return;
    }

    // Normalize map to: domain -> storeId
    const domainToStoreId: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawMap)) {
        if (Array.isArray(value)) {
            // Format: "storeId": ["domain1", "domain2"]
            value.forEach(domain => {
                domainToStoreId[domain] = key;
            });
        } else {
            // Format: "domain": "storeId"
            domainToStoreId[key] = value;
        }
    }

    const generatedAt = new Date().toISOString();
    const configs: Record<string, StoreConfig> = {};

    // Fetch store for each domain directly (this includes embedded menus)
    for (const [domain, storeId] of Object.entries(domainToStoreId)) {
        console.log(`Fetching store for domain: ${domain}...`);
        const store = await fetchStoreByDomain(domain);

        if (store) {
            configs[domain] = {
                storeId,
                generatedAt,
                storeData: removeSensitiveFields(store),
            };
            console.log(`  Cached store: ${store.name || store._id} (with ${Object.keys(store.menus || {}).length} menus)`);
        } else {
            console.warn(`  Failed to fetch store for domain: ${domain}`);
        }
    }

    // Ensure directory exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(configs, null, 2));
    console.log(`\n✓ Store configs written to ${OUTPUT_PATH}`);
    console.log(`  Total domains cached: ${Object.keys(configs).length}`);
}

main();

