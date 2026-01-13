'use client';

// Client wrapper for Header to access cart count from context
import React from 'react';
import { useCart } from '@/providers/CartProvider';
import { useWishlist } from '@/providers/WishlistProvider';
import { useAuth } from '@/providers/AuthProvider';

interface ClientHeaderWrapperProps {
    TemplateComponent: React.ComponentType<any>;
    templateProps: any;
}

export default function ClientHeaderWrapper({ TemplateComponent, templateProps }: ClientHeaderWrapperProps) {
    // Add safety checks as these hooks throw if provider is missing
    let cartCount = 0;
    let wishlistCount = 0;
    let isAuthenticated = false;

    try {
        const cart = useCart();
        cartCount = cart.cartCount;
    } catch (e) { }

    try {
        const wishlist = useWishlist();
        wishlistCount = wishlist.wishlistCount;
    } catch (e) { }

    try {
        const auth = useAuth();
        isAuthenticated = auth.isAuthenticated;
    } catch (e) { }

    // Merge server props with client props
    const mergedProps = {
        ...templateProps,
        cartCount,
        wishlistCount,
        isLoggedIn: isAuthenticated,
    };

    return <TemplateComponent {...mergedProps} />;
}
