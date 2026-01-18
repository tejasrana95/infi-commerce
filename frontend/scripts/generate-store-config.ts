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
    'settings.aiSettings',
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

async function fetchStore(storeId: string): Promise<any | null> {
    try {
        const res = await fetch(`${API_BASE}/stores/${storeId}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.store || data;
    } catch (error) {
        console.error(`Failed to fetch store ${storeId}:`, error);
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
    // Cache fetched stores to avoid duplicate requests
    const uniqueStoreIds = new Set(Object.values(domainToStoreId));
    const storeCache: Record<string, any> = {};
    // Fetch unique stores first
    for (const storeId of uniqueStoreIds) {
        const store = await fetchStore(storeId);
        if (store) {
            storeCache[storeId] = removeSensitiveFields(store);
        }
    }

    // Build the domain map
    for (const [domain, storeId] of Object.entries(domainToStoreId)) {
        const storeData = storeCache[storeId];

        if (storeData) {
            configs[domain] = {
                storeId,
                generatedAt,
                storeData,
            };
        }
    }

    // Ensure directory exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(configs, null, 2));
    console.log(`Store configs written to ${OUTPUT_PATH}`);
}

main();
