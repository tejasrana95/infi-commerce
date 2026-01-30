import { indexedDBService, STORES, IndexedDBCategory } from './indexedDB.service';

class CategoryCacheService {

    async getAllCategories(): Promise<IndexedDBCategory[]> {
        return indexedDBService.getAll<IndexedDBCategory>(STORES.CATEGORIES);
    }

    async getCategoryById(id: string): Promise<IndexedDBCategory | undefined> {
        return indexedDBService.getById<IndexedDBCategory>(STORES.CATEGORIES, id);
    }

    async getCategoryBySlug(slug: string): Promise<IndexedDBCategory | undefined> {
        const categories = await indexedDBService.getByIndex<IndexedDBCategory>(STORES.CATEGORIES, 'slug', slug);
        return categories.length > 0 ? categories[0] : undefined;
    }

    async getRootCategories(): Promise<IndexedDBCategory[]> {
        const allCategories = await this.getAllCategories();
        return allCategories.filter(c => !c.parentCategory);
    }

    async getChildCategories(parentId: string): Promise<IndexedDBCategory[]> {
        return indexedDBService.getByIndex<IndexedDBCategory>(STORES.CATEGORIES, 'parentCategory', parentId);
    }

    async saveCategories(categories: IndexedDBCategory[]): Promise<void> {
        await indexedDBService.putBulk(STORES.CATEGORIES, categories);
    }

    async clearCategories(): Promise<void> {
        await indexedDBService.clear(STORES.CATEGORIES);
    }

    async getCategoryCount(): Promise<number> {
        const categories = await this.getAllCategories();
        return categories.length;
    }
}

export const categoryCacheService = new CategoryCacheService();
