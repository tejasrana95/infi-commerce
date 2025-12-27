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
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const { isAuthenticated } = useAuth();

    // Merge server props with client props
    const mergedProps = {
        ...templateProps,
        cartCount,
        wishlistCount,
        isLoggedIn: isAuthenticated,
    };

    return <TemplateComponent {...mergedProps} />;
}
