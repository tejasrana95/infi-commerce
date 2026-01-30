'use client';

import React from 'react';
import { useSyncStore } from '../store/syncStore';
import { syncService } from '../services/sync.service';
import { productCacheService } from '../services/productCache.service';
import { categoryCacheService } from '../services/categoryCache.service';

export function SyncSettings() {
    const {
        isSyncing,
        lastSyncTime,
        syncError,
        productCount,
        categoryCount,
        isSyncingProducts,
        isSyncingCategories
    } = useSyncStore();

    const handleFullSync = async () => {
        if (confirm('This will re-download all products and categories. Continue?')) {
            await syncService.syncAll();
        }
    };

    const handleClearCache = async () => {
        if (confirm('Are you sure you want to clear the local cache? You will need to sync again.')) {
            await productCacheService.clearProducts();
            await categoryCacheService.clearCategories();
            alert('Cache cleared. Please sync data.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">Sync Status</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-500 text-sm block">Products</span>
                        <span className="text-xl font-bold text-gray-800">{productCount}</span>
                        {isSyncingProducts && <span className="text-xs text-blue-500 ml-2">Syncing...</span>}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-500 text-sm block">Categories</span>
                        <span className="text-xl font-bold text-gray-800">{categoryCount}</span>
                        {isSyncingCategories && <span className="text-xs text-blue-500 ml-2">Syncing...</span>}
                    </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                    <p>Last Sync: {lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}</p>
                    {syncError && <p className="text-red-500 mt-1">Error: {syncError}</p>}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleFullSync}
                        disabled={isSyncing}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                        {isSyncing ? 'Syncing...' : 'Force Full Sync'}
                    </button>

                    <button
                        onClick={handleClearCache}
                        disabled={isSyncing}
                        className="px-4 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50 text-sm font-medium"
                    >
                        Clear Cache
                    </button>
                </div>
            </div>
        </div>
    );
}
