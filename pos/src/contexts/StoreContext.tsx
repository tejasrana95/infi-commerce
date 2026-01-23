'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';

interface Store {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
    currency: string;
    timezone: string;
    settings?: any;
}

interface StoreContextType {
    storeId: string | null;
    store: Store | null;
    loading: boolean;
    error: string | null;
    setStoreId: (id: string) => void;
    clearStore: () => void;
    refreshStore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [storeId, setStoreIdState] = useState<string | null>(null);
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStoreData = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            // Use standard store API with the ID
            // We pass x-store-id header via interceptor if already set, 
            // but here we might need it explicitly if it's not in localStorage yet
            const response = await apiClient.get(`/stores/${id}`, {
                headers: { 'x-store-id': id }
            });
            setStore(response.data.store);
        } catch (err: any) {
            console.error('Failed to fetch store data:', err);
            setError(err.response?.data?.message || 'Failed to load store information');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load store ID from localStorage on mount
    useEffect(() => {
        const storedId = localStorage.getItem('poc_store_id');
        if (storedId) {
            setStoreIdState(storedId);
            fetchStoreData(storedId);
        } else {
            setLoading(false);
        }
    }, [fetchStoreData]);

    const setStoreId = (id: string) => {
        setStoreIdState(id);
        localStorage.setItem('poc_store_id', id);
        fetchStoreData(id);
    };

    const clearStore = () => {
        setStoreIdState(null);
        setStore(null);
        localStorage.removeItem('poc_store_id');
    };

    const refreshStore = async () => {
        if (storeId) {
            await fetchStoreData(storeId);
        }
    };

    return (
        <StoreContext.Provider value={{ storeId, store, loading, error, setStoreId, clearStore, refreshStore }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}
