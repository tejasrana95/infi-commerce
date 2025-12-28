'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, useTemplateId } from '@/providers/StoreProvider';
import { useCompare } from '@/providers/CompareProvider';
import { useWishlist } from '@/providers/WishlistProvider';
import { getComponent } from '@/components/templates/registry';
import api from '@/lib/api';
import { CompareProduct, CompareAttribute, ComparePageTemplateProps } from './types';
import { DEFAULT_COMPARE_CONFIG } from '@/types';
import { formatPrice } from '@/lib/currency';
import { useCurrency } from '@/hooks/useCurrency';

// ============================================
// Container Component
// ============================================

export default function ComparePageContainer() {
    const router = useRouter();
    const templateId = useTemplateId();
    const currency = useCurrency();
    const { store, themeConfig, currentCurrency } = useStore();
    const { items, removeFromCompare, clearCompare, config } = useCompare();
    const { addToWishlist } = useWishlist();

    // State
    const [products, setProducts] = useState<CompareProduct[]>([]);
    const [comparisonAttributes, setComparisonAttributes] = useState<CompareAttribute[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();

    // Fetch comparison data from API
    const fetchComparisonData = useCallback(async () => {
        if (items.length < 2 || !store?._id) {
            setProducts([]);
            setComparisonAttributes([]);
            return;
        }

        setIsLoading(true);
        setError(undefined);

        try {
            const response = await api.post('compare/products', {
                productIds: items.map(item => item.id),
                storeId: store._id,
                isMobile: window.innerWidth < 768,
            });

            if (response.success) {
                setProducts(response.products);
                setComparisonAttributes(response.comparisonAttributes || []);
            } else {
                setError(response.message || 'Failed to load comparison data');
            }
        } catch (err: any) {
            console.error('Compare fetch error:', err);
            setError(err.message || 'Failed to load comparison data');
        } finally {
            setIsLoading(false);
        }
    }, [items, store?._id]);

    // Fetch data when items change
    useEffect(() => {
        fetchComparisonData();
    }, [fetchComparisonData]);

    // Handlers
    const handleRemoveProduct = useCallback((productId: string) => {
        removeFromCompare(productId);
    }, [removeFromCompare]);

    const handleClearAll = useCallback(() => {
        clearCompare();
    }, [clearCompare]);

    const handleViewProduct = useCallback((slug: string) => {
        router.push(`/product/${slug}`);
    }, [router]);

    const handleAddToCart = useCallback((productId: string) => {
        // This will be implemented via CartContext
    }, []);

    const handleAddToWishlist = useCallback((productId: string) => {
        addToWishlist(productId);
    }, [addToWishlist]);

    // Format price helper
    const handleFormatPrice = useCallback((price: number) => {
        return formatPrice(price, currency ?? 'USD');
    }, [currency]);

    // Get the template component
    const Template = getComponent<ComparePageTemplateProps>('ComparePageTemplate', templateId);

    // Merge config with defaults
    const compareConfig = {
        ...DEFAULT_COMPARE_CONFIG,
        ...config,
    };

    // Prepare template props
    const templateProps: ComparePageTemplateProps = {
        products,
        comparisonAttributes,
        config: compareConfig,
        formatPrice: handleFormatPrice,
        currencySymbol: currentCurrency?.symbol || '$',
        isLoading,
        error,
        onRemoveProduct: handleRemoveProduct,
        onClearAll: handleClearAll,
        onViewProduct: handleViewProduct,
        onAddToCart: handleAddToCart,
        onAddToWishlist: handleAddToWishlist,
    };

    return <Template {...templateProps} />;
}
