'use client';

// Core ProductPage Container - Handles business logic and data processing

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { getComponent } from '@/components/templates/registry';
import { useStore, useThemeConfig } from '@/providers/StoreProvider';
import api from '@/lib/api';
import {
    Product,
    ProductVariant,
    ProductReview,
    ReviewStats,
    ReviewSettings,
    RelatedProduct,
    BreadcrumbItem,
    ProductPageConfig,
    ProductPageTemplateProps,
    DEFAULT_PRODUCT_PAGE_CONFIG,
    DEFAULT_REVIEW_SETTINGS,
} from './types';

interface ProductPageContainerProps {
    product: Product;
    layout?: any;
}

// Format price based on currency
function formatPrice(price: number, currency: { symbol: string; exchangeRate: number }): string {
    const converted = price * currency.exchangeRate;
    return `${currency.symbol}${converted.toFixed(2)}`;
}

export default function ProductPageContainer({
    product: initialProduct,
    layout,
}: ProductPageContainerProps) {
    const { store, currentCurrency } = useStore();
    const themeConfig = useThemeConfig();
    // api is imported directly as a singleton

    // Currency
    const currencySymbol = currentCurrency?.symbol || '$';
    const exchangeRate = currentCurrency?.exchangeRate || 1;

    // Configuration
    const config: ProductPageConfig = useMemo(() => ({
        ...DEFAULT_PRODUCT_PAGE_CONFIG,
        ...themeConfig?.product,
    }), [themeConfig?.product]);

    const reviewSettings: ReviewSettings = useMemo(() => ({
        ...DEFAULT_REVIEW_SETTINGS,
        ...store?.settings?.reviewSettings,
    }), [store?.settings?.reviewSettings]);

    const templateId = store?.theme?.templateId || 'modern-clean';

    // ============================================
    // Product State
    // ============================================
    const [product] = useState<Product>(() => {
        // Enhance product with formatted prices
        const rate = exchangeRate;
        const currentPrice = initialProduct.isOnSale && initialProduct.salePrice
            ? initialProduct.salePrice
            : initialProduct.price;
        const compareAt = initialProduct.isOnSale
            ? initialProduct.price
            : undefined;

        return {
            ...initialProduct,
            formattedPrice: formatPrice(currentPrice, { symbol: currencySymbol, exchangeRate: rate }),
            formattedSalePrice: initialProduct.salePrice
                ? formatPrice(initialProduct.salePrice, { symbol: currencySymbol, exchangeRate: rate })
                : undefined,
            formattedCompareAtPrice: compareAt
                ? formatPrice(compareAt, { symbol: currencySymbol, exchangeRate: rate })
                : undefined,
            discountPercent: compareAt
                ? Math.round((1 - currentPrice / compareAt) * 100)
                : undefined,
        };
    });

    // ============================================
    // Variant Selection
    // ============================================
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        // Initialize with first available values
        const initial: Record<string, string> = {};
        if (product.productOptions) {
            product.productOptions.forEach((option) => {
                if (option.values.length > 0) {
                    initial[option.name] = option.values[0];
                }
            });
        }
        return initial;
    });

    const selectedVariant = useMemo<ProductVariant | null>(() => {
        if (!product.variants || product.variants.length === 0) return null;

        return product.variants.find((variant) => {
            return Object.entries(selectedOptions).every(
                ([key, value]) => variant.attributes[key] === value
            );
        }) || null;
    }, [product.variants, selectedOptions]);

    const handleOptionChange = useCallback((optionName: string, value: string) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [optionName]: value,
        }));
    }, []);

    // ============================================
    // Quantity
    // ============================================
    const [quantity, setQuantity] = useState(1);

    const handleQuantityChange = useCallback((newQuantity: number) => {
        const maxStock = selectedVariant?.stock ?? product.stock;
        const clampedQuantity = Math.max(1, Math.min(newQuantity, maxStock));
        setQuantity(clampedQuantity);
    }, [selectedVariant, product.stock]);

    // ============================================
    // Cart Actions
    // ============================================
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const handleAddToCart = useCallback(async () => {
        setIsAddingToCart(true);
        try {
            // TODO: Integrate with cart context/API
            await new Promise((resolve) => setTimeout(resolve, 500));
            console.log('Add to cart:', {
                productId: product._id,
                variantSku: selectedVariant?.sku,
                quantity,
            });
        } finally {
            setIsAddingToCart(false);
        }
    }, [product._id, selectedVariant, quantity]);

    const handleBuyNow = useCallback(async () => {
        await handleAddToCart();
        // TODO: Navigate to checkout
        window.location.href = '/checkout';
    }, [handleAddToCart]);

    const handleAddToWishlist = useCallback(() => {
        // TODO: Integrate with wishlist context/API
        console.log('Add to wishlist:', product._id);
    }, [product._id]);

    const handleAddToCompare = useCallback(() => {
        // TODO: Integrate with compare context/API
        console.log('Add to compare:', product._id);
    }, [product._id]);

    // ============================================
    // Reviews
    // ============================================
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsPagination, setReviewsPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const fetchReviews = useCallback(async (page = 1, append = false) => {
        if (!reviewSettings.allowReviews) return;

        setReviewsLoading(true);
        try {
            const response = await api.get(
                `reviews/product/${product._id}?page=${page}&limit=${reviewsPagination.limit}`
            );

            if (append) {
                setReviews((prev) => [...prev, ...(response.reviews || [])]);
            } else {
                setReviews(response.reviews || []);
            }

            setReviewStats(response.stats || null);
            setReviewsPagination((prev) => ({
                ...prev,
                page,
                total: response.pagination?.total || 0,
                pages: response.pagination?.pages || 0,
            }));
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setReviewsLoading(false);
        }
    }, [api, product._id, reviewSettings.allowReviews, reviewsPagination.limit]);

    useEffect(() => {
        if (reviewSettings.allowReviews) {
            fetchReviews(1);
        }
    }, [fetchReviews, reviewSettings.allowReviews]);

    const handleLoadMoreReviews = useCallback(() => {
        if (reviewsPagination.page < reviewsPagination.pages) {
            fetchReviews(reviewsPagination.page + 1, true);
        }
    }, [fetchReviews, reviewsPagination]);

    const handleSubmitReview = useCallback(async (reviewData: {
        rating: number;
        title: string;
        content: string;
        images?: string[];
        guestName?: string;
        guestEmail?: string;
    }): Promise<boolean> => {
        setIsSubmittingReview(true);
        try {
            const isGuest = !!(reviewData.guestName && reviewData.guestEmail);

            await api.post('reviews', {
                storeId: store?._id,
                productId: product._id,
                isGuestReview: isGuest,
                guestName: reviewData.guestName,
                guestEmail: reviewData.guestEmail,
                rating: reviewData.rating,
                title: reviewData.title,
                content: reviewData.content,
                images: reviewData.images,
            });

            // Refresh reviews
            await fetchReviews(1);
            return true;
        } catch (error) {
            console.error('Failed to submit review:', error);
            return false;
        } finally {
            setIsSubmittingReview(false);
        }
    }, [api, store?._id, product._id, fetchReviews]);

    // ============================================
    // Related Products
    // ============================================
    const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
    const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);

    useEffect(() => {
        if (!config.relatedProducts?.enabled) return;

        const fetchRelated = async () => {
            setRelatedProductsLoading(true);
            try {
                // Fetch related products from same category
                const categoryId = product.categoryIds?.[0];
                if (categoryId) {
                    const response = await api.get(
                        `products?storeId=${store?._id}&categoryId=${categoryId}&limit=${config.relatedProducts?.count || 8}&exclude=${product._id}`
                    );
                    setRelatedProducts(response.products || []);
                }
            } catch (error) {
                console.error('Failed to fetch related products:', error);
            } finally {
                setRelatedProductsLoading(false);
            }
        };

        fetchRelated();
    }, [api, store?._id, product._id, product.categoryIds, config.relatedProducts]);

    // ============================================
    // Breadcrumbs
    // ============================================
    const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
        const crumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

        if (product.categories && product.categories.length > 0) {
            const category = product.categories[0];
            crumbs.push({
                label: category.title,
                href: `/category/${category.slug}`,
            });
        }

        crumbs.push({ label: product.name });

        return crumbs;
    }, [product.categories, product.name]);

    // ============================================
    // User State
    // ============================================
    const isLoggedIn = false; // TODO: Get from auth context

    // ============================================
    // Render Template
    // ============================================
    const ProductPageTemplate = getComponent('ProductPageTemplate', templateId);

    const templateProps: ProductPageTemplateProps = {
        product,
        breadcrumbs,
        selectedVariant,
        selectedOptions,
        onOptionChange: handleOptionChange,
        quantity,
        onQuantityChange: handleQuantityChange,
        onAddToCart: handleAddToCart,
        onBuyNow: handleBuyNow,
        onAddToWishlist: handleAddToWishlist,
        onAddToCompare: handleAddToCompare,
        isAddingToCart,
        reviews,
        reviewStats,
        reviewSettings,
        reviewsLoading,
        reviewsPagination,
        onLoadMoreReviews: handleLoadMoreReviews,
        onSubmitReview: handleSubmitReview,
        isSubmittingReview,
        relatedProducts,
        relatedProductsLoading,
        config,
        currencySymbol,
        exchangeRate,
        templateId,
        cardConfig: themeConfig?.productCard,
        layout,
        isLoggedIn,
    };

    return <ProductPageTemplate {...templateProps} />;
}
