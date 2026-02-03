import { indexedDBService, STORES, IndexedDBProduct } from './indexedDB.service';

class ProductCacheService {

    async getAllProducts(): Promise<IndexedDBProduct[]> {
        return indexedDBService.getAll<IndexedDBProduct>(STORES.PRODUCTS);
    }

    async getProductById(id: string): Promise<IndexedDBProduct | undefined> {
        return indexedDBService.getById<IndexedDBProduct>(STORES.PRODUCTS, id);
    }

    async getProductBySku(sku: string): Promise<IndexedDBProduct | undefined> {
        // 1. Try exact match on main Product SKU
        const products = await indexedDBService.getByIndex<IndexedDBProduct>(STORES.PRODUCTS, 'sku', sku);
        if (products.length > 0) return products[0];

        // 2. Fallback: Search in variants
        // Since we don't have a direct index on variant SKUs, we scan all products
        // Optimization: In a real large DB, we should have a multi-entry index for variant SKUs.
        const allProducts = await this.getAllProducts();
        return allProducts.find(p => p.variants?.some(v => v.sku === sku));
    }

    async getProductByBarcode(barcode: string): Promise<IndexedDBProduct | undefined> {
        // 1. Try exact match on main Product Barcode
        const products = await indexedDBService.getByIndex<IndexedDBProduct>(STORES.PRODUCTS, 'barcode', barcode);
        if (products.length > 0) return products[0];

        // 2. Fallback: Search in variants
        const allProducts = await this.getAllProducts();
        return allProducts.find(p => p.variants?.some(v => v.barcode === barcode || v.sku === barcode));
    }

    async searchProducts(query: string = '', limit: number = 50): Promise<IndexedDBProduct[]> {
        // We get all products and filter in memory because IndexedDB text search is limited
        // The 'searchText' field is pre-computed to make this faster
        const allProducts = await this.getAllProducts();

        const lowerQuery = query.toLowerCase();

        const results = allProducts
            .filter(p => p.searchText && p.searchText.includes(lowerQuery))
            .sort((a, b) => {
                // Simple relevance sorting
                const aExact = a.name.toLowerCase() === lowerQuery;
                const bExact = b.name.toLowerCase() === lowerQuery;
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;

                const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
                const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                // Tie-breaker: Newest first
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            })
            .slice(0, limit);

        return results;
    }

    async getProductsByCategory(categoryId: string): Promise<IndexedDBProduct[]> {
        // We use the multi-entry index for categoryIds
        const products = await indexedDBService.getByIndex<IndexedDBProduct>(STORES.PRODUCTS, 'categoryIds', categoryId);
        // Sort by createdAt desc
        return products.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }

    async saveProducts(products: IndexedDBProduct[]): Promise<void> {
        await indexedDBService.putBulk(STORES.PRODUCTS, products);
    }

    async clearProducts(): Promise<void> {
        await indexedDBService.clear(STORES.PRODUCTS);
    }

    async getProductCount(): Promise<number> {
        const products = await this.getAllProducts();
        return products.length;
    }
}

export const productCacheService = new ProductCacheService();
