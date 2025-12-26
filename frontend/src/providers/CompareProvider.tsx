'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from './StoreProvider';
import { CompareConfig, DEFAULT_COMPARE_CONFIG } from '@/types';

// ============================================
// Types
// ============================================

export interface CompareItem {
    id: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    categoryIds: { _id: string; title: string; slug: string }[];
}

interface CompareContextType {
    /** List of products in compare */
    items: CompareItem[];
    /** Number of items in compare */
    compareCount: number;
    /** Check if product is in compare */
    isInCompare: (productId: string) => boolean;
    /** Add product to compare - returns success/error */
    addToCompare: (product: CompareItem) => { success: boolean; error?: string };
    /** Remove product from compare */
    removeFromCompare: (productId: string) => void;
    /** Clear all products from compare */
    clearCompare: () => void;
    /** Check if product can be added to compare */
    canAddToCompare: (product: CompareItem) => { canAdd: boolean; reason?: string };
    /** Compare configuration */
    config: CompareConfig;
    /** Get max products based on screen size */
    maxProducts: number;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'compare_items';

// ============================================
// Context
// ============================================

const CompareContext = createContext<CompareContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

export function CompareProvider({ children }: { children: React.ReactNode }) {
    const { themeConfig } = useStore();
    const [items, setItems] = useState<CompareItem[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    // Get compare config from theme or use defaults
    const config: CompareConfig = useMemo(() => ({
        ...DEFAULT_COMPARE_CONFIG,
        ...(themeConfig?.compare || {}),
    }), [themeConfig?.compare]);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get max products based on screen size
    const maxProducts = isMobile ? config.maxProductsMobile : config.maxProducts;

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    // Limit to max products on load (in case config changed)
                    setItems(parsed.slice(0, maxProducts));
                }
            }
        } catch (error) {
            console.error('Failed to load compare items from localStorage:', error);
        }
    }, [maxProducts]);

    // Save to localStorage when items change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Failed to save compare items to localStorage:', error);
        }
    }, [items]);

    // Check if product is in compare
    const isInCompare = useCallback((productId: string): boolean => {
        return items.some(item => item.id === productId);
    }, [items]);

    // Check if product can be added
    const canAddToCompare = useCallback((product: CompareItem): { canAdd: boolean; reason?: string } => {
        // Check if feature is enabled
        if (!config.enabled) {
            return { canAdd: false, reason: 'Compare feature is disabled' };
        }

        // Check if already in compare
        if (isInCompare(product.id)) {
            return { canAdd: false, reason: 'Product is already in compare list' };
        }

        // Check max products limit
        if (items.length >= maxProducts) {
            return { canAdd: false, reason: `Maximum ${maxProducts} products can be compared` };
        }

        // If no items in compare, we can add (category check only needed for 2nd+ item)
        if (items.length === 0) {
            return { canAdd: true };
        }
        // Collect ALL category IDs from ALL existing items
        const allExistingCategoryIds = new Set<string>();
        items.forEach(item => {
            item.categoryIds.forEach(catId => allExistingCategoryIds.add(catId._id));
        });
        // Check if new product shares at least one category with existing items
        const hasCommonCategory = product.categoryIds.some(catId => allExistingCategoryIds.has(catId._id));
        if (!hasCommonCategory) {
            return { canAdd: false, reason: 'Products must be from the same category' };
        }

        return { canAdd: true };
    }, [config.enabled, config.requireSameCategory, isInCompare, items, maxProducts]);

    // Add to compare
    const addToCompare = useCallback((product: CompareItem): { success: boolean; error?: string } => {
        const { canAdd, reason } = canAddToCompare(product);
        if (!canAdd) {
            return { success: false, error: reason };
        }

        setItems(prev => [...prev, product]);
        return { success: true };
    }, [canAddToCompare]);

    // Remove from compare
    const removeFromCompare = useCallback((productId: string): void => {
        setItems(prev => prev.filter(item => item.id !== productId));
    }, []);

    // Clear all
    const clearCompare = useCallback((): void => {
        setItems([]);
    }, []);

    // Memoize context value
    const value = useMemo<CompareContextType>(() => ({
        items,
        compareCount: items.length,
        isInCompare,
        addToCompare,
        removeFromCompare,
        clearCompare,
        canAddToCompare,
        config,
        maxProducts,
    }), [items, isInCompare, addToCompare, removeFromCompare, clearCompare, canAddToCompare, config, maxProducts]);

    return (
        <CompareContext.Provider value={value}>
            {children}
        </CompareContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useCompare(): CompareContextType {
    const context = useContext(CompareContext);
    if (context === undefined) {
        throw new Error('useCompare must be used within a CompareProvider');
    }
    return context;
}

// Convenience hook for single product
export function useProductCompare(productId: string, categoryIds: CompareItem['categoryIds']) {
    const { isInCompare, addToCompare, removeFromCompare, canAddToCompare } = useCompare();

    const inCompare = isInCompare(productId);
    const { canAdd, reason } = canAddToCompare({
        id: productId,
        name: '',
        slug: '',
        image: '',
        price: 0,
        categoryIds,
    });

    return {
        isInCompare: inCompare,
        canAdd: canAdd || inCompare, // Can always "add" if already in compare (for toggle)
        reason,
        toggle: (product: CompareItem) => {
            if (inCompare) {
                removeFromCompare(productId);
                return { success: true };
            } else {
                return addToCompare(product);
            }
        },
        add: (product: CompareItem) => addToCompare(product),
        remove: () => removeFromCompare(productId),
    };
}
