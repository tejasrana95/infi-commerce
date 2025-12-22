'use client';

// Core ProductPage Container - Handles business logic and data processing

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { getComponent } from '@/components/templates/registry';
import { useStore, useThemeConfig } from '@/providers/StoreProvider';
import api from '@/lib/api';
import {
    Product,
    ProductVariant,
    Review,
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
    // Get Variation Options (only options marked as isVariation)
    // ============================================
    const variationOptions = useMemo(() => {
        return (product.productOptions || []).filter(opt => opt.isVariation);
    }, [product.productOptions]);

    // ============================================
    // Variant Selection - Using Attribute IDs
    // ============================================
    // selectedOptions maps optionId (attribute ID) -> selected value
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

    // Calculate available options based on current selections
    // When user selects an attribute, filter other attributes to show only valid combinations
    const availableOptions = useMemo<Record<string, string[]>>(() => {
        if (!product.variants || product.variants.length === 0) {
            // No variants - return all values from productOptions
            const available: Record<string, string[]> = {};
            variationOptions.forEach(opt => {
                // Extract just the value strings from OptionValue objects
                available[opt.optionId] = opt.values.map(v => v.value);
            });
            return available;
        }

        const available: Record<string, string[]> = {};

        variationOptions.forEach(option => {
            // Find variants that match all OTHER selected attributes
            const otherSelections = { ...selectedOptions };
            delete otherSelections[option.optionId];

            // Filter variants that match all other selections
            const matchingVariants = product.variants!.filter(variant => {
                return Object.entries(otherSelections).every(
                    ([attrId, value]) => variant.attributes[attrId] === value
                );
            });

            // Get unique values for this attribute from matching variants
            const variantValues = [...new Set(
                matchingVariants
                    .map(v => v.attributes[option.optionId])
                    .filter(Boolean)
            )];

            // Filter option values to only include those available in matching variants
            available[option.optionId] = option.values
                .map(v => v.value)
                .filter(val => variantValues.includes(val));
        });

        return available;
    }, [product.variants, selectedOptions, variationOptions]);

    // Find the currently selected variant
    const selectedVariant = useMemo<ProductVariant | null>(() => {
        if (!product.variants || product.variants.length === 0) return null;

        // Check if all variation options have been selected
        const allSelected = variationOptions.every(opt => selectedOptions[opt.optionId]);
        if (!allSelected) return null;

        // Find variant matching all selected attributes
        return product.variants.find(variant => {
            return variationOptions.every(opt =>
                variant.attributes[opt.optionId] === selectedOptions[opt.optionId]
            );
        }) || null;
    }, [product.variants, selectedOptions, variationOptions]);

    // Find a variant that matches current selections (even if incomplete)
    // Used for previewing images/prices while selecting
    const matchingVariant = useMemo<ProductVariant | null>(() => {
        if (selectedVariant) return selectedVariant;
        if (!product.variants || product.variants.length === 0) return null;
        if (Object.keys(selectedOptions).length === 0) return null;

        return product.variants.find(variant => {
            return Object.entries(selectedOptions).every(([optionId, value]) => {
                return variant.attributes[optionId] === value;
            });
        }) || null;
    }, [product.variants, selectedOptions, selectedVariant]);

    // Check if all required options are selected
    const allOptionsSelected = useMemo(() => {
        if (variationOptions.length === 0) return true;
        return variationOptions.every(opt => selectedOptions[opt.optionId]);
    }, [variationOptions, selectedOptions]);

    // Handle option change - also reset dependent options if the new selection makes them invalid
    const handleOptionChange = useCallback((optionId: string, value: string) => {
        setSelectedOptions(prev => {
            const newSelections = { ...prev, [optionId]: value };

            // Validate and potentially reset other options that are no longer valid
            if (product.variants && product.variants.length > 0) {
                variationOptions.forEach(opt => {
                    if (opt.optionId === optionId) return; // Skip the one we just changed

                    const currentValue = newSelections[opt.optionId];
                    if (!currentValue) return; // Not selected yet

                    // Check if this value is still valid given the new selection
                    const otherSelections = { ...newSelections };
                    delete otherSelections[opt.optionId];

                    const matchingVariants = product.variants!.filter(variant =>
                        Object.entries(otherSelections).every(
                            ([attrId, val]) => variant.attributes[attrId] === val
                        )
                    );

                    const validValues = matchingVariants.map(v => v.attributes[opt.optionId]);
                    if (!validValues.includes(currentValue)) {
                        // Current value is no longer valid - reset or set to first available
                        if (validValues.length > 0) {
                            newSelections[opt.optionId] = validValues[0];
                        } else {
                            delete newSelections[opt.optionId];
                        }
                    }
                });
            }

            return newSelections;
        });
    }, [product.variants, variationOptions]);

    // ============================================
    // Quantity
    // ============================================
    const [quantity, setQuantity] = useState(1);

    // Auto-clamp quantity when variant changes (e.g. from high stock to low stock variant)
    useEffect(() => {
        if (selectedVariant) {
            const maxStock = selectedVariant.stock;
            // Only clamp if stock is defined and we are exceeding it
            if (maxStock !== undefined && quantity > maxStock) {
                setQuantity(Math.max(1, maxStock));
            }
        }
    }, [selectedVariant, quantity]);

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
        // For variable products, require all options to be selected
        if (product.type === 'variable' && !allOptionsSelected) {
            console.warn('Please select all options before adding to cart');
            return;
        }

        // Check stock
        const currentStock = selectedVariant?.stock ?? product.stock;

        // Only check stock level if stock management is enabled
        if (product.manageStock && currentStock <= 0) {
            console.warn('Product is out of stock');
            return;
        }

        setIsAddingToCart(true);
        try {
            // TODO: Integrate with cart context/API
            await new Promise((resolve) => setTimeout(resolve, 500));
            console.log('Add to cart:', {
                productId: product._id,
                variantId: selectedVariant?._id,
                variantSku: selectedVariant?.sku,
                selectedOptions,
                quantity,
            });
        } finally {
            setIsAddingToCart(false);
        }
    }, [product._id, product.type, product.stock, selectedVariant, selectedOptions, quantity, allOptionsSelected]);

    const handleBuyNow = useCallback(async () => {
        await handleAddToCart();
        window.location.href = '/checkout';
    }, [handleAddToCart]);

    const handleAddToWishlist = useCallback(() => {
        console.log('Add to wishlist:', product._id);
    }, [product._id]);

    const handleAddToCompare = useCallback(() => {
        console.log('Add to compare:', product._id);
    }, [product._id]);

    // ============================================
    // Reviews
    // ============================================
    const [reviews, setReviews] = useState<Review[]>([]);
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
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState<string | undefined>(undefined);

    useEffect(() => {
        const token = api.getToken();
        if (token) {
            setIsLoggedIn(true);
            try {
                // Simple JWT decode
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.id) {
                    setUserId(payload.id);
                }
            } catch (e) {
                console.error('Failed to decode token:', e);
            }
        }
    }, []);

    const handleHelpfulVote = useCallback(async (reviewId: string) => {
        if (!isLoggedIn) return;

        try {
            const response = await api.post(`reviews/${reviewId}/helpful`);

            if (response.success) {
                setReviews(prevReviews => prevReviews.map(r => {
                    if (r._id === reviewId) {
                        let newVotedBy = r.votedBy || [];
                        if (response.hasVoted) {
                            if (!newVotedBy.includes(userId!)) {
                                newVotedBy = [...newVotedBy, userId!];
                            }
                        } else {
                            if (userId) {
                                newVotedBy = newVotedBy.filter((id: string) => id !== userId);
                            }
                        }

                        return {
                            ...r,
                            helpfulCount: response.helpfulCount,
                            votedBy: newVotedBy
                        };
                    }
                    return r;
                }));
            }
        } catch (error) {
            console.error('Failed to vote helpful:', error);
        }
    }, [isLoggedIn, userId]);

    // ============================================
    // Tax Calculation
    // ============================================
    const taxInfo = useMemo(() => {
        if (!store?.settings?.taxEnabled) return undefined;

        const taxRate = store.settings.taxRate || 0; // Default or fetch slab
        const taxSettings = store.settings.tax || { pricesIncludeTax: false };

        const price = product.isOnSale && product.salePrice ? product.salePrice : product.price;
        let amount = 0;
        let priceWithoutTax = price;
        let priceWithTax = price;

        if (taxSettings.pricesIncludeTax) {
            // Price includes tax: Tax = Price - (Price / (1 + rate))
            amount = price - (price / (1 + taxRate / 100));
            priceWithoutTax = price - amount;
            priceWithTax = price;
        } else {
            // Price excludes tax: Tax = Price * rate
            amount = price * (taxRate / 100);
            priceWithTax = price + amount;
            priceWithoutTax = price;
        }

        return {
            rate: taxRate,
            amount,
            included: taxSettings.pricesIncludeTax,
            formattedAmount: formatPrice(amount, { symbol: currencySymbol, exchangeRate }),
            formattedPriceWithoutTax: formatPrice(priceWithoutTax, { symbol: currencySymbol, exchangeRate }),
            formattedPriceWithTax: formatPrice(priceWithTax, { symbol: currencySymbol, exchangeRate }),
        };
    }, [product.price, product.salePrice, product.isOnSale, store?.settings, currencySymbol, exchangeRate]);

    // ============================================
    // Shipping Calculator
    // ============================================
    const [shippingEstimate, setShippingEstimate] = useState<{
        loading: boolean;
        error?: string;
        cost?: number;
        formattedCost?: string;
        days?: string;
    }>({ loading: false });

    const handleCalculateShipping = useCallback(async (zip: string, country: string) => {
        setShippingEstimate({ loading: true });
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 800));
            const cost = 15; // Mock cost
            setShippingEstimate({
                loading: false,
                cost,
                formattedCost: formatPrice(cost, { symbol: currencySymbol, exchangeRate }),
                days: '3-5 business days'
            });
        } catch (e) {
            setShippingEstimate({ loading: false, error: 'Failed to calculate shipping' });
        }
    }, [currencySymbol, exchangeRate]);

    // ============================================
    // Render Template
    // ============================================
    const ProductPageTemplate = getComponent('ProductPageTemplate', templateId);

    const templateProps: ProductPageTemplateProps = {
        product,
        breadcrumbs,
        selectedVariant,
        matchingVariant, // Pass the partial match for preview
        selectedOptions,
        availableOptions,
        allOptionsSelected,
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
        onHelpfulVote: handleHelpfulVote,
        relatedProducts,
        config,
        currencySymbol,
        exchangeRate,
        templateId,
        cardConfig: themeConfig?.productCard,
        layout,
        isLoggedIn,
        userId,
        taxInfo,
        shippingEstimate,
        onCalculateShipping: handleCalculateShipping,
    };

    return <ProductPageTemplate {...templateProps} />;
}
