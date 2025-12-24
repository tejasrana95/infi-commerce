'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthProvider';
import api from '@/lib/api';

// ============================================
// Types
// ============================================

interface WishlistContextType {
    /** Set of product IDs in wishlist for O(1) lookup */
    wishlistIds: Set<string>;
    /** Number of items in wishlist */
    wishlistCount: number;
    /** Check if product is in wishlist */
    isInWishlist: (productId: string) => boolean;
    /** Add product to wishlist */
    addToWishlist: (productId: string) => Promise<boolean>;
    /** Remove product from wishlist */
    removeFromWishlist: (productId: string) => Promise<boolean>;
    /** Toggle product in wishlist */
    toggleWishlist: (productId: string) => Promise<boolean>;
    /** Loading state for initial fetch */
    isLoading: boolean;
    /** Refresh wishlist from server */
    refreshWishlist: () => Promise<void>;
}

// ============================================
// Context
// ============================================

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Fetch wishlist on mount and when auth changes
    const fetchWishlist = useCallback(async () => {
        if (!isAuthenticated) {
            setWishlistIds(new Set());
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.get('wishlist');
            // Extract just the IDs from the populated wishlist
            const ids = (response.wishlist || []).map((item: any) =>
                typeof item === 'string' ? item : item._id
            );
            setWishlistIds(new Set(ids));
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
            setWishlistIds(new Set());
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    // Check if product is in wishlist
    const isInWishlist = useCallback((productId: string): boolean => {
        return wishlistIds.has(productId);
    }, [wishlistIds]);

    // Add to wishlist
    const addToWishlist = useCallback(async (productId: string): Promise<boolean> => {
        if (!isAuthenticated) {
            // Redirect to login
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return false;
        }

        // Optimistic update
        setWishlistIds(prev => new Set([...prev, productId]));

        try {
            await api.post(`wishlist/${productId}`);
            return true;
        } catch (error) {
            // Rollback on error
            setWishlistIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });
            console.error('Failed to add to wishlist:', error);
            return false;
        }
    }, [isAuthenticated]);

    // Remove from wishlist
    const removeFromWishlist = useCallback(async (productId: string): Promise<boolean> => {
        if (!isAuthenticated) return false;

        // Optimistic update
        setWishlistIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
        });

        try {
            await api.delete(`wishlist/${productId}`);
            return true;
        } catch (error) {
            // Rollback on error
            setWishlistIds(prev => new Set([...prev, productId]));
            console.error('Failed to remove from wishlist:', error);
            return false;
        }
    }, [isAuthenticated]);

    // Toggle wishlist
    const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
        if (isInWishlist(productId)) {
            return removeFromWishlist(productId);
        } else {
            return addToWishlist(productId);
        }
    }, [isInWishlist, addToWishlist, removeFromWishlist]);

    // Memoize context value
    const value = useMemo<WishlistContextType>(() => ({
        wishlistIds,
        wishlistCount: wishlistIds.size,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isLoading,
        refreshWishlist: fetchWishlist,
    }), [wishlistIds, isInWishlist, addToWishlist, removeFromWishlist, toggleWishlist, isLoading, fetchWishlist]);

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useWishlist(): WishlistContextType {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}

// Convenience hook for single product
export function useProductWishlist(productId: string) {
    const { isInWishlist, toggleWishlist, addToWishlist, removeFromWishlist } = useWishlist();

    return {
        isWishlisted: isInWishlist(productId),
        toggle: () => toggleWishlist(productId),
        add: () => addToWishlist(productId),
        remove: () => removeFromWishlist(productId),
    };
}
