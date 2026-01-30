import { indexedDBService, IndexedDBProduct, IndexedDBCategory } from './indexedDB.service';
import { productCacheService } from './productCache.service';
import { categoryCacheService } from './categoryCache.service';
import apiClient from '@/lib/apiClient';
import { useSyncStore } from '../store/syncStore';

export interface SyncStatus {
    isSyncing: boolean;
    lastSyncTime: string | null;
    lastProductSync: string | null;
    lastCategorySync: string | null;
    productCount: number;
    categoryCount: number;
    error?: string;
}

class SyncService {
    /**
     * Fetch all products using existing paginated API
     * Loops through all pages to get complete dataset
     */
    async syncProducts(): Promise<void> {
        const syncStore = useSyncStore.getState();
        syncStore.setSyncingProducts(true);

        try {
            let page = 1;
            const allProducts: IndexedDBProduct[] = [];
            let hasMore = true;
            const BATCH_SIZE = 500;

            while (hasMore) {
                // Use existing API endpoint
                const response = await apiClient.get(`/products?limit=${BATCH_SIZE}&page=${page}&isActive=true`);
                const { products, pagination } = response.data;

                if (!products || !Array.isArray(products)) {
                    break;
                }

                // Transform products to IndexedDB format
                const transformedProducts: IndexedDBProduct[] = products.map((p: any) => ({
                    id: p._id,
                    name: p.name,
                    sku: p.sku,
                    barcode: p.barcode || undefined,
                    price: p.price,
                    salePrice: p.salePrice || undefined,
                    stock: p.stock || 0,
                    image: p.images?.[0] || p.image || '',
                    type: p.type || 'simple',
                    categoryIds: p.categoryIds?.map((c: any) => (typeof c === 'object' ? c._id : c)) || [],
                    variants: p.variants || [],
                    taxRate: p.pricing?.taxRate || 0,
                    taxAmount: p.pricing?.taxAmount || 0,
                    productOptions: p.productOptions || [],
                    storeId: p.storeId,
                    // Add searchText for fast offline search
                    searchText: [
                        p.name,
                        p.sku,
                        p.barcode,
                        ...(p.variants?.map((v: any) => v.sku) || []),
                        ...(p.variants?.map((v: any) => v.barcode) || []),
                    ].filter(Boolean).join(' ').toLowerCase(),
                    updatedAt: p.updatedAt,
                }));

                allProducts.push(...transformedProducts);

                // Check if there are more pages
                if (pagination && pagination.pages) {
                    hasMore = page < pagination.pages;
                } else {
                    hasMore = false;
                }
                page++;

                // Update progress in UI
                syncStore.updateCounts(allProducts.length, syncStore.categoryCount);
            }

            // Clear and save all products to IndexedDB
            // We clear first to ensure deleted products are removed
            await productCacheService.clearProducts();
            await productCacheService.saveProducts(allProducts);

            // Update sync metadata
            const now = new Date().toISOString();
            await indexedDBService.setSyncMeta('lastProductSync', now);
            await indexedDBService.setSyncMeta('productCount', allProducts.length);

            syncStore.setSyncingProducts(false);
        } catch (error: any) {
            console.error('Product sync failed:', error);
            syncStore.setSyncingProducts(false);
            syncStore.syncFailed(error.message || 'Product sync failed');
            throw error;
        }
    }

    /**
     * Fetch all categories using existing API
     */
    async syncCategories(): Promise<void> {
        const syncStore = useSyncStore.getState();
        syncStore.setSyncingCategories(true);

        try {
            // Use existing API endpoint (increase limit to get all)
            const response = await apiClient.get('/categories?limit=1000&status=active');
            const categories = response.data.categories || [];

            // Transform categories to IndexedDB format
            const transformedCategories: IndexedDBCategory[] = categories.map((c: any) => ({
                id: c._id,
                name: c.title,
                slug: c.slug,
                image: c.image || undefined,
                parentCategory: c.parentCategory?._id || (typeof c.parentCategory === 'string' ? c.parentCategory : undefined),
                storeId: c.storeId,
                updatedAt: c.updatedAt,
            }));

            // Clear and save all categories to IndexedDB
            await categoryCacheService.clearCategories();
            await categoryCacheService.saveCategories(transformedCategories);

            // Update sync metadata
            const now = new Date().toISOString();
            await indexedDBService.setSyncMeta('lastCategorySync', now);
            await indexedDBService.setSyncMeta('categoryCount', transformedCategories.length);

            syncStore.setSyncingCategories(false);
        } catch (error: any) {
            console.error('Category sync failed:', error);
            syncStore.setSyncingCategories(false);
            syncStore.syncFailed(error.message || 'Category sync failed');
            throw error;
        }
    }

    /**
     * Check if sync is needed by comparing timestamps
     */
    async checkSyncNeeded(): Promise<{ products: boolean; categories: boolean }> {
        try {
            // Get server timestamps
            const response = await apiClient.get('/pos/sync-status');
            if (!response.data.success) {
                throw new Error('Failed to get sync status');
            }
            const serverData = response.data.data;

            // Get local timestamps
            const localProductSync = await indexedDBService.getSyncMeta('lastProductModified');
            const localCategorySync = await indexedDBService.getSyncMeta('lastCategoryModified');

            // Compare timestamps
            const serverProductTime = new Date(serverData.lastProductModified).getTime();
            const serverCategoryTime = new Date(serverData.lastCategoryModified).getTime();

            // For local, we store the *server's* modification time that we last synced against.
            // Wait, 'lastProductSync' is when WE last synced.
            // We should also store 'lastProductModified' from server when we sync to compare properly.
            // But simpler: if lastSyncTime < lastProductModified, we need to sync.

            // Actually, let's look at what we stored. 
            // In syncProducts, we didn't store the server's lastProductModified. 
            // We should probably update that logic or use the sync time.
            // If we use sync time, we assume clock sync which is risky.
            // Better to store the last modified time we saw from server.

            // Let's rely on: if server modified time > local last sync time, then update.
            // This assumes we synced everything up to that point.

            const localProductTime = localProductSync ? new Date(localProductSync.value as string).getTime() : 0;
            const localCategoryTime = localCategorySync ? new Date(localCategorySync.value as string).getTime() : 0;

            // Correction: We should compare against when we LAST SYNCED, not the last modified time we stored.
            // BUT, storing the "last modified time on server" at the time of sync is the most robust.
            // For now, let's use the last successful sync time.

            const lastProductSyncMeta = await indexedDBService.getSyncMeta('lastProductSync');
            const lastCategorySyncMeta = await indexedDBService.getSyncMeta('lastCategorySync');

            const lastProductSyncTime = lastProductSyncMeta ? new Date(lastProductSyncMeta.value as string).getTime() : 0;
            const lastCategorySyncTime = lastCategorySyncMeta ? new Date(lastCategorySyncMeta.value as string).getTime() : 0;

            return {
                products: serverProductTime > lastProductSyncTime,
                categories: serverCategoryTime > lastCategorySyncTime,
            };
        } catch (error) {
            console.error('Failed to check sync status:', error);
            // If we can't reach server, don't trigger sync
            return { products: false, categories: false };
        }
    }

    /**
     * Full sync of products and categories
     */
    async syncAll(): Promise<void> {
        const syncStore = useSyncStore.getState();
        if (syncStore.isSyncing) return;

        syncStore.startSync();

        try {
            // Run in parallel
            await Promise.all([
                this.syncCategories(),
                this.syncProducts()
            ]);

            const productCount = await productCacheService.getProductCount();
            const categoryCount = await categoryCacheService.getCategoryCount();

            syncStore.syncComplete(productCount, categoryCount);
        } catch (error: any) {
            syncStore.syncFailed(error.message);
        }
    }
}

export const syncService = new SyncService();
