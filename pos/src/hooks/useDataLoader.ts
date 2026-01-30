import { useEffect } from 'react';
import { useSyncStore } from '../store/syncStore';
import { syncService } from '../services/sync.service';
import { productCacheService } from '../services/productCache.service';
import { categoryCacheService } from '../services/categoryCache.service';

export function useDataLoader() {
    const {
        isInitialized,
        setInitialized,
        startSync,
        updateCounts,
        isSyncing
    } = useSyncStore();

    useEffect(() => {
        let mounted = true;

        async function initData() {
            if (isInitialized) return;

            try {
                // Load initial counts from IndexedDB
                const [pCount, cCount] = await Promise.all([
                    productCacheService.getProductCount(),
                    categoryCacheService.getCategoryCount()
                ]);

                if (mounted) {
                    updateCounts(pCount, cCount);
                    setInitialized(true);
                }

                // Check if we need to sync
                // We do this after initialization to show UI immediately
                const needsSync = await syncService.checkSyncNeeded();

                // Also force sync if local DB is empty but we expect data
                // (Use a simple heuristic: if count is 0, try sync)
                const isEmpty = pCount === 0 && cCount === 0;

                if (needsSync.products || needsSync.categories || isEmpty) {
                    // Trigger sync in background
                    syncService.syncAll();
                }

            } catch (error) {
                console.error('Failed to initialize data loader:', error);
                if (mounted) {
                    setInitialized(true); // Still mark as initialized to unblock UI
                }
            }
        }

        initData();

        return () => {
            mounted = false;
        };
    }, [isInitialized, setInitialized, updateCounts]);

    return {
        isLoading: !isInitialized,
        isSyncing
    };
}
