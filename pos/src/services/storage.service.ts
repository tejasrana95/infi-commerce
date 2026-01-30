import { indexedDBService } from './indexedDB.service';

class StorageService {
    private useIndexedDB: boolean = true;
    private initialized: boolean = false;

    async initialize(): Promise<void> {
        if (this.initialized) return;

        // Check if IndexedDB is available (fails in Safari Private Mode)
        this.useIndexedDB = await this.checkIndexedDBSupport();

        if (!this.useIndexedDB) {
            console.warn('[StorageService] IndexedDB not available, falling back to localStorage');
            console.warn('[StorageService] This may happen in Safari Private Browsing mode');
        }

        this.initialized = true;
    }

    private async checkIndexedDBSupport(): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                if (!window.indexedDB) {
                    resolve(false);
                    return;
                }

                const request = window.indexedDB.open('__safari_test__', 1);

                request.onerror = () => {
                    resolve(false);
                };

                request.onsuccess = () => {
                    request.result.close();
                    window.indexedDB.deleteDatabase('__safari_test__');
                    resolve(true);
                };

                // Safari may throw synchronously
            } catch (e) {
                resolve(false);
            }
        });
    }

    isIndexedDBAvailable(): boolean {
        return this.useIndexedDB;
    }

    // Fallback methods for localStorage (limited capacity - ~5MB)
    // Only use for essential data if IndexedDB fails
    async getFromLocalStorage<T>(key: string): Promise<T | null> {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    async setToLocalStorage<T>(key: string, value: T): Promise<void> {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            // localStorage quota exceeded
            console.error('[StorageService] localStorage quota exceeded');
        }
    }
}

export const storageService = new StorageService();
