import Store from '../models/Store';

/**
 * Update the lastProductModified timestamp for a store
 * Call this after any product create/update/delete
 * 
 * @param storeId The store ID
 */
export async function updateProductSyncTimestamp(storeId: string): Promise<void> {
    try {
        await Store.findByIdAndUpdate(storeId, {
            lastProductModified: new Date(),
        });
    } catch (error) {
        console.error('Failed to update product sync timestamp:', error);
        // Don't throw error to avoid failing the main operation
    }
}

/**
 * Update the lastCategoryModified timestamp for a store
 * Call this after any category create/update/delete
 * 
 * @param storeId The store ID
 */
export async function updateCategorySyncTimestamp(storeId: string): Promise<void> {
    try {
        await Store.findByIdAndUpdate(storeId, {
            lastCategoryModified: new Date(),
        });
    } catch (error) {
        console.error('Failed to update category sync timestamp:', error);
        // Don't throw error to avoid failing the main operation
    }
}
