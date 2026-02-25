'use client';

// Client wrapper for Header to access cart count from context
import React from 'react';
import { useCart } from '@/providers/CartProvider';
import { useWishlist } from '@/providers/WishlistProvider';
import { useAuth } from '@/providers/AuthProvider';
import { getComponent } from '@/components/templates/registry';

interface ClientHeaderWrapperProps {
    templateId: string;
    templateProps: any;
}

export default function ClientHeaderWrapper({ templateId, templateProps }: ClientHeaderWrapperProps) {
    // Resolve the template component client-side — avoids passing functions as props
    // across the Server→Client boundary (not allowed with next/dynamic components).
    const TemplateComponent = getComponent('HeaderTemplate', templateId);

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
