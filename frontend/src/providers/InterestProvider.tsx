'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/api';

interface ViewedProduct {
    productId: string;
    categoryIds: string[];
    tags: string[];
    viewedAt: string;
}

interface SearchQuery {
    query: string;
    searchedAt: string;
}

interface PurchasedProduct {
    productId: string;
    categoryIds: string[];
    purchasedAt: string;
}

interface LocalInterestData {
    viewedProducts: ViewedProduct[];
    searchQueries: SearchQuery[];
    purchasedProducts: PurchasedProduct[];
}

interface InterestContextValue {
    trackProductView: (productId: any, categoryIds: any[], tags: string[]) => void;
    trackSearch: (query: string) => void;
    trackPurchase: (products: Array<{ productId: any; categoryIds: any[] }>) => void;
    getLocalData: () => LocalInterestData;
    clearData: () => void;
}

const STORAGE_KEY = 'user_interests';
const MAX_VIEWS = 100;
const MAX_SEARCHES = 50;

const InterestContext = createContext<InterestContextValue | null>(null);

export function InterestProvider({ children }: { children: React.ReactNode }) {
    const { store } = useStore();
    const { isAuthenticated } = useAuth();
    const syncedRef = useRef(false);

    // Get stored data from localStorage
    const getLocalData = useCallback((): LocalInterestData => {
        if (typeof window === 'undefined') {
            return { viewedProducts: [], searchQueries: [], purchasedProducts: [] };
        }
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to parse interest data:', e);
        }
        return { viewedProducts: [], searchQueries: [], purchasedProducts: [] };
    }, []);

    // Save data to localStorage
    const saveLocalData = useCallback((data: LocalInterestData) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save interest data:', e);
        }
    }, []);

    // Clean old data based on retention days
    const cleanOldData = useCallback((data: LocalInterestData, retentionDays: number = 30): LocalInterestData => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retentionDays);
        const cutoffTime = cutoff.getTime();

        return {
            viewedProducts: data.viewedProducts.filter(v => new Date(v.viewedAt).getTime() > cutoffTime),
            searchQueries: data.searchQueries.filter(s => new Date(s.searchedAt).getTime() > cutoffTime),
            purchasedProducts: data.purchasedProducts.filter(p => new Date(p.purchasedAt).getTime() > cutoffTime),
        };
    }, []);

    // Track product view
    const trackProductView = useCallback((productId: any, categoryIds: any[], tags: string[]) => {
        const data = getLocalData();
        const now = new Date().toISOString();

        // Ensure we only store string IDs
        const pid = typeof productId === 'string' ? productId : (productId as any)._id || productId.toString();
        const cids = Array.isArray(categoryIds) ? categoryIds.map(id => typeof id === 'string' ? id : (id as any)._id || id.toString()) : [];
        const tgs = Array.isArray(tags) ? tags : [];

        // Avoid duplicate views within 5 minutes
        const recentView = data.viewedProducts.find(
            v => v.productId === pid &&
                (Date.now() - new Date(v.viewedAt).getTime()) < 5 * 60 * 1000
        );

        if (!recentView) {
            data.viewedProducts.unshift({ productId: pid, categoryIds: cids, tags: tgs, viewedAt: now });
            // Keep only last MAX_VIEWS
            data.viewedProducts = data.viewedProducts.slice(0, MAX_VIEWS);
            saveLocalData(cleanOldData(data));

            // Also send to API if authenticated
            if (isAuthenticated && store?._id) {
                api.post('interests/track', {
                    storeId: store._id,
                    eventType: 'view',
                    data: { productId: pid, categoryIds: cids, tags: tgs },
                }).catch(console.error);
            }
        }
    }, [getLocalData, saveLocalData, cleanOldData, isAuthenticated, store]);

    // Track search query
    const trackSearch = useCallback((query: string) => {
        if (!query.trim()) return;

        const data = getLocalData();
        const now = new Date().toISOString();

        data.searchQueries.unshift({ query: query.trim().toLowerCase(), searchedAt: now });
        // Keep only last MAX_SEARCHES
        data.searchQueries = data.searchQueries.slice(0, MAX_SEARCHES);
        saveLocalData(cleanOldData(data));

        // Also send to API if authenticated
        if (isAuthenticated && store?._id) {
            api.post('interests/track', {
                storeId: store._id,
                eventType: 'search',
                data: { query: query.trim() },
            }).catch(console.error);
        }
    }, [getLocalData, saveLocalData, cleanOldData, isAuthenticated, store]);

    // Track purchase
    const trackPurchase = useCallback((products: Array<{ productId: any; categoryIds: any[] }>) => {
        const data = getLocalData();
        const now = new Date().toISOString();

        for (const product of products) {
            const pid = typeof product.productId === 'string' ? product.productId : (product.productId as any)._id || product.productId.toString();
            const cids = Array.isArray(product.categoryIds) ? product.categoryIds.map(id => typeof id === 'string' ? id : (id as any)._id || id.toString()) : [];

            data.purchasedProducts.unshift({
                productId: pid,
                categoryIds: cids,
                purchasedAt: now,
            });
        }
        saveLocalData(cleanOldData(data));

        // Also send to API if authenticated
        if (isAuthenticated && store?._id) {
            api.post('interests/track', {
                storeId: store._id,
                eventType: 'purchase',
                data: { products },
            }).catch(console.error);
        }
    }, [getLocalData, saveLocalData, cleanOldData, isAuthenticated, store]);

    // Clear all data
    const clearData = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    // Sync localStorage to API on login
    useEffect(() => {
        if (isAuthenticated && store?._id && !syncedRef.current) {
            syncedRef.current = true;
            const localData = getLocalData();

            if (localData.viewedProducts.length > 0 || localData.searchQueries.length > 0 || localData.purchasedProducts.length > 0) {
                // Ensure store ID is set on API client before first fetch
                api.setStoreId(store._id);
                api.post('interests/sync', {
                    storeId: store._id,
                    localData,
                }).catch(console.error);
            }
        }
    }, [isAuthenticated, store, getLocalData]);

    const value: InterestContextValue = {
        trackProductView,
        trackSearch,
        trackPurchase,
        getLocalData,
        clearData,
    };

    return (
        <InterestContext.Provider value={value}>
            {children}
        </InterestContext.Provider>
    );
}

export function useInterest() {
    const context = useContext(InterestContext);
    if (!context) {
        throw new Error('useInterest must be used within an InterestProvider');
    }
    return context;
}

export default InterestProvider;
