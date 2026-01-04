'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthProvider';
import { useStore } from './StoreProvider';
import api from '@/lib/api';
import { Cart, CartItem, AddToCartParams, UpdateCartItemParams } from '@/types/cart';

// ============================================
// Types
// ============================================

interface CartContextType {
    /** Current cart */
    cart: Cart | null;
    /** Cart items */
    items: CartItem[];
    /** Total number of items in cart */
    cartCount: number;
    /** Loading state */
    isLoading: boolean;
    /** Add item to cart */
    addToCart: (params: AddToCartParams) => Promise<{ success: boolean; error?: string }>;
    /** Update cart item quantity */
    updateCartItem: (params: UpdateCartItemParams) => Promise<{ success: boolean; error?: string }>;
    /** Remove item from cart */
    removeFromCart: (itemId: string) => Promise<{ success: boolean; error?: string }>;
    /** Clear entire cart */
    clearCart: () => Promise<{ success: boolean; error?: string }>;
    /** Refresh cart from server */
    refreshCart: () => Promise<void>;
    /** Validate cart items */
    validateCart: () => Promise<any>;
}

// ============================================
// Context
// ============================================

const CartContext = createContext<CartContextType | undefined>(undefined);

// ============================================
// Helper Functions
// ============================================

// Generate a unique session ID for guest users
function generateSessionId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Get or create session ID
function getSessionId(): string {
    let sessionId = localStorage.getItem('cart-session-id');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('cart-session-id', sessionId);
    }
    return sessionId;
}

// ============================================
// Provider Component
// ============================================

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const { store } = useStore();
    const [cart, setCart] = useState<Cart | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Get session ID for guest users
    const sessionId = useMemo(() => {
        if (typeof window === 'undefined') return null;
        return !isAuthenticated ? getSessionId() : null;
    }, [isAuthenticated]);

    // Set or clear session ID on API client based on auth state
    useEffect(() => {
        if (isAuthenticated) {
            // User is logged in - clear session ID
            api.setSessionId('');
        } else if (sessionId) {
            // User is guest - set session ID
            api.setSessionId(sessionId);
        }
    }, [sessionId, isAuthenticated]);

    // Fetch cart from server
    const fetchCart = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('cart');
            setCart(response.cart || null);
        } catch (error: any) {
            console.error('Failed to fetch cart:', error);
            // If cart doesn't exist (404), clear local state
            // This is important after order creation when backend deletes the cart
            if (error.status === 404 || error.message === 'Cart not found') {
                setCart(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch cart on mount and when auth/session changes
    useEffect(() => {
        if (store?._id) {
            // Ensure store ID is set on API client before first fetch
            // This prevents race condition with StoreProvider
            api.setStoreId(store._id);
            fetchCart();
        }
    }, [fetchCart, store?._id]);

    // Merge guest cart with user cart after login
    useEffect(() => {
        const mergeGuestCart = async () => {
            if (!isAuthenticated) return;

            const guestSessionId = localStorage.getItem('cart-session-id');
            if (!guestSessionId) return;

            try {
                await api.post('cart/merge', { sessionId: guestSessionId });
                // Clear guest session after merge
                localStorage.removeItem('cart-session-id');
                // Refresh cart to get merged data
                await fetchCart();
            } catch (error) {
                console.error('Failed to merge cart:', error);
            }
        };

        mergeGuestCart();
    }, [isAuthenticated, fetchCart]);

    // Add to cart
    const addToCart = useCallback(async (params: AddToCartParams): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await api.post('cart/items', params);

            if (response.cart) {
                setCart(response.cart);
                return { success: true };
            }

            return { success: false, error: 'Failed to add item to cart' };
        } catch (error: any) {
            console.error('Failed to add to cart:', error);
            return {
                success: false,
                error: error.message || 'Failed to add item to cart'
            };
        }
    }, []);

    // Update cart item quantity
    const updateCartItem = useCallback(async (params: UpdateCartItemParams): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await api.put(`cart/items/${params.itemId}`, {
                quantity: params.quantity
            });

            if (response.cart) {
                setCart(response.cart);
                return { success: true };
            }

            return { success: false, error: 'Failed to update cart item' };
        } catch (error: any) {
            console.error('Failed to update cart item:', error);
            return {
                success: false,
                error: error.message || 'Failed to update cart item'
            };
        }
    }, []);

    // Remove from cart
    const removeFromCart = useCallback(async (itemId: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await api.delete(`cart/items/${itemId}`);

            if (response.cart) {
                setCart(response.cart);
                return { success: true };
            }

            return { success: false, error: 'Failed to remove item from cart' };
        } catch (error: any) {
            console.error('Failed to remove from cart:', error);
            return {
                success: false,
                error: error.message || 'Failed to remove item from cart'
            };
        }
    }, []);

    // Clear cart
    const clearCart = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await api.delete('cart/clear');

            if (response.cart) {
                setCart(response.cart);
                return { success: true };
            }

            return { success: false, error: 'Failed to clear cart' };
        } catch (error: any) {
            // If cart is already gone (404), that's fine, we should still clear local state
            if (error.status === 404 || error.message === 'Cart not found') {
                setCart(null);
                return { success: true };
            }
            return {
                success: false,
                error: error.message || 'Failed to clear cart'
            };
        }
    }, []);

    // Validate cart
    const validateCart = useCallback(async () => {
        try {
            const response = await api.post('cart/validate', {});

            if (response.cart) {
                setCart(response.cart);
            }

            return response;
        } catch (error: any) {
            console.error('Failed to validate cart:', error);
            return { valid: false, error: error.message };
        }
    }, []);

    // Computed values
    const items = cart?.items || [];
    const cartCount = items.reduce((total, item) => total + item.quantity, 0);

    // Memoize context value
    const value = useMemo<CartContextType>(() => ({
        cart,
        items,
        cartCount,
        isLoading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
        validateCart,
    }), [cart, items, cartCount, isLoading, addToCart, updateCartItem, removeFromCart, clearCart, fetchCart, validateCart]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useCart(): CartContextType {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
