import { create } from 'zustand';

interface SyncState {
    // Status
    isSyncing: boolean;
    isSyncingProducts: boolean;
    isSyncingCategories: boolean;
    lastSyncTime: Date | null;
    syncError: string | null;

    // Counts
    productCount: number;
    categoryCount: number;

    // Initialization
    isInitialized: boolean;
    isInitializing: boolean;

    // Actions
    startSync: () => void;
    setSyncingProducts: (isSyncing: boolean) => void;
    setSyncingCategories: (isSyncing: boolean) => void;
    syncComplete: (productCount: number, categoryCount: number) => void;
    syncFailed: (error: string) => void;
    setInitialized: (value: boolean) => void;
    updateCounts: (products: number, categories: number) => void;
    updateSyncProgress: (counts: { products: number; totalProducts: number }) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
    // Initial State
    isSyncing: false,
    isSyncingProducts: false,
    isSyncingCategories: false,
    lastSyncTime: null,
    syncError: null,
    productCount: 0,
    categoryCount: 0,
    isInitialized: false,
    isInitializing: true, // Start as initializing until checked

    // Actions
    startSync: () => set({
        isSyncing: true,
        syncError: null
    }),

    setSyncingProducts: (isSyncing: boolean) => set((state) => ({
        isSyncingProducts: isSyncing,
        isSyncing: isSyncing || state.isSyncingCategories // Still syncing if either is true
    })),

    setSyncingCategories: (isSyncing: boolean) => set((state) => ({
        isSyncingCategories: isSyncing,
        isSyncing: isSyncing || state.isSyncingProducts
    })),

    syncComplete: (productCount: number, categoryCount: number) => set({
        isSyncing: false,
        isSyncingProducts: false,
        isSyncingCategories: false,
        lastSyncTime: new Date(),
        productCount,
        categoryCount,
        syncError: null,
    }),

    syncFailed: (error: string) => set({
        isSyncing: false,
        isSyncingProducts: false,
        isSyncingCategories: false,
        syncError: error,
    }),

    setInitialized: (value: boolean) => set({
        isInitialized: value,
        isInitializing: false,
    }),

    updateCounts: (productCount: number, categoryCount: number) => set({
        productCount,
        categoryCount,
    }),

    updateSyncProgress: ({ products, totalProducts }) => set((state) => ({
        // calculated percent could be stored if needed, but for now we just track counts
        // productCount: products, // Optional: update count as we go
    })),
}));
