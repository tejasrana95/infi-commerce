import { ProductVariant, ProductOption } from '../types';

// Database Configuration
const DB_NAME = 'pos_offline_cache';
const DB_VERSION = 2;

// Object Stores (Tables)
export const STORES = {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    SYNC_META: 'syncMeta',
} as const;

// Interface Definitions
export interface SyncMeta {
    key: string; // 'lastSync' | 'lastProductModified' | 'lastCategoryModified'
    value: string | number | Date;
    updatedAt: string;
}

export interface IndexedDBProduct {
    id: string;           // Primary key (MongoDB _id)
    name: string;
    sku: string;
    barcode?: string;
    price: number;
    salePrice?: number;
    stock: number;
    image: string;
    type: 'simple' | 'variable';
    categoryIds: string[];
    variants?: ProductVariant[];
    taxRate?: number;
    taxAmount?: number;
    productOptions?: ProductOption[];
    storeId: string;
    updatedAt: string; // ISO string for Safari compatibility
    createdAt: string; // ISO string for sorting
    // Search optimization fields
    searchText: string;   // Lowercase concatenation of name + sku + barcode for fast search
    // Pricing object for tax-inclusive prices
    pricing?: {
        price: number;
        salePrice?: number;
        priceWithTax: number;
        salePriceWithTax?: number;
        taxRate: number;
        taxAmount: number;
        finalPrice: number;
        originalPrice: number;
        isOnSale: boolean;
        discountPercent?: number;
    };
}

export interface IndexedDBCategory {
    id: string;           // Primary key
    name: string;
    slug: string;
    image?: string;
    parentCategory?: string;
    storeId: string;
    updatedAt: string; // ISO string for Safari compatibility
}

class IndexedDBService {
    private dbPromise: Promise<IDBDatabase> | null = null;

    constructor() {
        // We don't open the DB immediately to avoid issues during server-side rendering (if any)
        // or if the environment doesn't support it (e.g. some tests)
    }

    /**
     * Open the database connection
     */
    private async openDatabase(): Promise<IDBDatabase> {
        if (this.dbPromise) {
            return this.dbPromise;
        }

        this.dbPromise = new Promise((resolve, reject) => {
            // Check for IndexedDB support
            if (!window.indexedDB) {
                reject(new Error('IndexedDB is not supported in this browser.'));
                return;
            }

            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                const db = request.result;

                // Generic error handler for DB
                db.onerror = (event: Event) => {
                    console.error('Database error:', (event.target as any).error);
                };

                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const db = request.result;
                const transaction = request.transaction;
                if (transaction) {
                    this.initializeSchema(db, transaction, event.oldVersion);
                }
            };
        });

        return this.dbPromise;
    }

    /**
     * Initialize object stores and indexes
     */
    private initializeSchema(db: IDBDatabase, transaction: IDBTransaction, oldVersion: number) {
        // PRODUCTS Store
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
            const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
            productStore.createIndex('sku', 'sku', { unique: false });
            productStore.createIndex('barcode', 'barcode', { unique: false });
            productStore.createIndex('categoryIds', 'categoryIds', { multiEntry: true });
            productStore.createIndex('storeId', 'storeId', { unique: false });
            // searchText index might not be useful with standard IDB indexes for partial match, 
            // but keeping it for potential exact matches or future usage
            productStore.createIndex('searchText', 'searchText', { unique: false });
            productStore.createIndex('createdAt', 'createdAt', { unique: false });
        } else {
            // Upgrade existing store if needed (check if index missing)
            const productStore = transaction.objectStore(STORES.PRODUCTS);
            if (!productStore.indexNames.contains('createdAt')) {
                productStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
        }

        // CATEGORIES Store
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
            const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
            categoryStore.createIndex('slug', 'slug', { unique: false });
            categoryStore.createIndex('storeId', 'storeId', { unique: false });
            categoryStore.createIndex('parentCategory', 'parentCategory', { unique: false });
        }

        // SYNC META Store
        if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
            db.createObjectStore(STORES.SYNC_META, { keyPath: 'key' });
        }
    }

    /**
     * Helper to perform transaction
     */
    private async performTransaction<T>(
        storeNames: string[],
        mode: IDBTransactionMode,
        callback: (transaction: IDBTransaction) => Promise<T> | T
    ): Promise<T> {
        const db = await this.openDatabase();

        return new Promise(async (resolve, reject) => {
            const transaction = db.transaction(storeNames, mode);

            transaction.onerror = () => {
                reject(transaction.error);
            };

            // In Safari, we must be careful with async operations inside transactions
            // ensuring the transaction doesn't commit prematurely.
            // However, the callback here is initiating the request.

            try {
                const result = await callback(transaction);
                // We don't rely on transaction.oncomplete for the result because 
                // read-only transactions might not fire it in the same way we expect for data return,
                // but for write operations it's critical.

                if (mode === 'readwrite') {
                    transaction.oncomplete = () => resolve(result);
                } else {
                    resolve(result);
                }
            } catch (error) {
                // If the callback throws, we should try to abort if possible, although it might be auto-aborted.
                try {
                    transaction.abort();
                } catch (e) {
                    // ignore if already finished
                }
                reject(error);
            }
        });
    }

    /**
     * Helper to wrap IDBRequest in Promise
     */
    private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // --- CRUD Operations ---

    async getAll<T>(storeName: string): Promise<T[]> {
        try {
            return await this.performTransaction([storeName], 'readonly', (transaction) => {
                const store = transaction.objectStore(storeName);
                return this.requestToPromise(store.getAll());
            });
        } catch (e) {
            console.error(`Error getting all from ${storeName}:`, e);
            return [];
        }
    }

    async getById<T>(storeName: string, id: string): Promise<T | undefined> {
        try {
            return await this.performTransaction([storeName], 'readonly', (transaction) => {
                const store = transaction.objectStore(storeName);
                return this.requestToPromise(store.get(id));
            });
        } catch (e) {
            console.error(`Error getting by id from ${storeName}:`, e);
            return undefined;
        }
    }

    async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
        try {
            return await this.performTransaction([storeName], 'readonly', (transaction) => {
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                return this.requestToPromise(index.getAll(value));
            });
        } catch (e) {
            console.error(`Error getting by index ${indexName} from ${storeName}:`, e);
            return [];
        }
    }

    async getOneByIndex<T>(storeName: string, indexName: string, value: any): Promise<T | undefined> {
        try {
            return await this.performTransaction([storeName], 'readonly', (transaction) => {
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                return this.requestToPromise(index.get(value));
            });
        } catch (e) {
            console.error(`Error getting one by index ${indexName} from ${storeName}:`, e);
            return undefined;
        }
    }

    async put<T>(storeName: string, data: T): Promise<void> {
        await this.performTransaction([storeName], 'readwrite', (transaction) => {
            const store = transaction.objectStore(storeName);
            store.put(data);
        });
    }

    async putBulk<T>(storeName: string, data: T[]): Promise<void> {
        if (data.length === 0) return;

        await this.performTransaction([storeName], 'readwrite', (transaction) => {
            const store = transaction.objectStore(storeName);
            data.forEach(item => {
                store.put(item);
            });
        });
    }

    async delete(storeName: string, id: string): Promise<void> {
        await this.performTransaction([storeName], 'readwrite', (transaction) => {
            const store = transaction.objectStore(storeName);
            store.delete(id);
        });
    }

    async clear(storeName: string): Promise<void> {
        await this.performTransaction([storeName], 'readwrite', (transaction) => {
            const store = transaction.objectStore(storeName);
            store.clear();
        });
    }

    async clearAll(): Promise<void> {
        const db = await this.openDatabase();
        const storeNames = Array.from(db.objectStoreNames);

        if (storeNames.length === 0) return;

        await this.performTransaction(storeNames, 'readwrite', (transaction) => {
            storeNames.forEach(name => {
                transaction.objectStore(name).clear();
            });
        });
    }

    async getSyncMeta(key: string): Promise<SyncMeta | undefined> {
        return this.getById<SyncMeta>(STORES.SYNC_META, key);
    }

    async setSyncMeta(key: string, value: string | number | Date): Promise<void> {
        const meta: SyncMeta = {
            key,
            value,
            updatedAt: new Date().toISOString()
        };
        await this.put(STORES.SYNC_META, meta);
    }

    /**
     * Explicitly close the database connection.
     * Useful for unit testing or when resetting the app state.
     */
    async close(): Promise<void> {
        if (this.dbPromise) {
            const db = await this.dbPromise;
            db.close();
            this.dbPromise = null;
        }
    }
}

export const indexedDBService = new IndexedDBService();
