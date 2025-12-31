'use client';

// Core ProductPage Container - Handles business logic and data processing

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { getComponent } from '@/components/templates/registry';
import { useStore, useThemeConfig } from '@/providers/StoreProvider';
import { useWishlist } from '@/providers/WishlistProvider';
import { useCompare, CompareItem } from '@/providers/CompareProvider';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';
import { useCustomer } from '@/providers/AuthProvider';
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
import { formatPrice } from '@/lib/currency';
import { useCurrency } from '@/hooks/useCurrency';

interface ProductPageContainerProps {
    product: Product;
    layout?: any;
}



export default function ProductPageContainer({
    product: initialProduct,
    layout,
}: ProductPageContainerProps) {
    const { store, currentCurrency } = useStore();
    const themeConfig = useThemeConfig();
    const currency = useCurrency();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { addToCompare, isInCompare, removeFromCompare, canAddToCompare, config: compareConfig } = useCompare();
    const { addToCart: addToCartAPI } = useCart();
    const { success: toastSuccess, error: toastError, warning } = useToast();
    const { customer, defaultShippingAddress } = useCustomer();

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
            formattedPrice: formatPrice(currentPrice, currency),
            formattedSalePrice: initialProduct.salePrice
                ? formatPrice(initialProduct.salePrice, currency)
                : undefined,
            formattedCompareAtPrice: compareAt
                ? formatPrice(compareAt, currency)
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
            warning('Please select all options before adding to cart');
            return;
        }

        // Check stock
        const currentStock = selectedVariant?.stock ?? product.stock;

        // Only check stock level if stock management is enabled
        if (product.manageStock && currentStock <= 0) {
            warning('Product is out of stock');
            return;
        }

        setIsAddingToCart(true);
        try {
            const result = await addToCartAPI({
                productId: product._id,
                variantId: selectedVariant?._id,
                quantity,
                storeId: store?._id || '',
            });

            if (result.success) {
                toastSuccess(`${product.name} added to cart`);
            } else {
                toastError(`Failed to add to cart: ${result.error}`);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toastError('An error occurred while adding to cart');
        } finally {
            setIsAddingToCart(false);
        }
    }, [product._id, product.type, product.stock, product.manageStock, selectedVariant, quantity, allOptionsSelected, addToCartAPI, store?._id]);

    const handleBuyNow = useCallback(async () => {
        await handleAddToCart();
        window.location.href = '/checkout';
    }, [handleAddToCart]);

    // Wishlist state from context
    const isWishlisted = isInWishlist(product._id);

    const handleToggleWishlist = useCallback(() => {
        toggleWishlist(product._id);
    }, [toggleWishlist, product._id]);

    const handleAddToCompare = useCallback(() => {
        if (isInCompare(product._id)) {
            removeFromCompare(product._id);
        } else {
            const compareItem: CompareItem = {
                id: product._id,
                name: product.name,
                slug: product.slug,
                image: product.featuredImage || product.images?.[0] || '',
                price: product.pricing?.finalPrice || product.salePrice || product.price,
                categoryIds: product.categoryIds || [],
            };
            const result = addToCompare(compareItem);
            if (!result.success && result.error) {
                warning(result.error);
            }
        }
    }, [product._id, product.name, product.slug, product.featuredImage, product.images, product.pricing, product.salePrice, product.price, product.categoryIds, isInCompare, addToCompare, removeFromCompare]);

    // ============================================
    // User State (moved before Reviews so it's available for review handlers)
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
            // Determine if this is a guest review based on login state
            const isGuest = !isLoggedIn && !!(reviewData.guestName && reviewData.guestEmail);

            await api.post('reviews', {
                storeId: store?._id,
                productId: product._id,
                customerId: isLoggedIn ? userId : undefined,  // Include customerId for logged-in users
                isGuestReview: isGuest,
                guestName: isGuest ? reviewData.guestName : undefined,
                guestEmail: isGuest ? reviewData.guestEmail : undefined,
                rating: reviewData.rating,
                title: reviewData.title,
                content: reviewData.content,
                images: reviewData.images,
            });

            await fetchReviews(1);
            toastSuccess('Review submitted successfully. Our system will review it and publish it soon.');
            return true;
        } catch (error) {
            if (error instanceof Error && error.message === 'Customer has already reviewed this product') {
                toastError('You have already reviewed this product');
            }
            return false;
        } finally {
            setIsSubmittingReview(false);
        }
    }, [api, store?._id, product._id, fetchReviews, isLoggedIn, userId]);

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
                        `products?storeId=${store?._id}&categoryId=${categoryId}&limit=${config.relatedProducts?.limit || 8}&exclude=${product._id}`
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

    // User State is now defined earlier in the file (line ~290)

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
    // Tax info now comes directly from product.pricing (API response)
    // No store-level tax calculation needed
    // ============================================

    // ============================================
    // Shipping Calculator
    // ============================================
    const [shippingEstimate, setShippingEstimate] = useState<{
        loading: boolean;
        error?: string;
        cost?: number;
        description?: string;
        name?: string;
    }>({ loading: false });

    const handleCalculateShipping = useCallback(async (zip: string, country: string) => {
        setShippingEstimate({ loading: true });
        try {
            const response = await api.post('shipping/calculate-smart', {
                storeId: store?._id,
                country,
                zip,
                items: [{
                    productId: product._id,
                    variantId: selectedVariant?._id,
                    quantity
                }],
                currency: typeof currency === 'string' ? currency : currency.code
            });

            if (response.success) {
                setShippingEstimate({
                    loading: false,
                    cost: response.shippingCost,
                    description: response.description,
                    name: response.name
                });
            } else {
                setShippingEstimate({
                    loading: false,
                    error: response.message || 'No shipping options available for this location'
                });
            }
        } catch (e: any) {
            setShippingEstimate({ loading: false, error: e.message || 'Failed to calculate shipping' });
        }
    }, [store?._id, product._id, selectedVariant?._id, quantity, currency]);

    const userDefaultCountry = defaultShippingAddress?.country;

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
        onAddToWishlist: handleToggleWishlist,
        isWishlisted,
        onAddToCompare: handleAddToCompare,
        isInCompare: isInCompare(product._id),
        compareEnabled: compareConfig.enabled !== false && compareConfig.showInProductPage !== false,
        compareDisabled: (() => {
            const compareItem: CompareItem = {
                id: product._id,
                name: product.name,
                slug: product.slug,
                image: product.featuredImage || product.images?.[0] || '',
                price: product.pricing?.finalPrice || product.salePrice || product.price,
                categoryIds: product.categoryIds || [],
            };
            const { canAdd } = canAddToCompare(compareItem);
            return !canAdd && !isInCompare(product._id);
        })(),
        compareDisabledReason: (() => {
            const compareItem: CompareItem = {
                id: product._id,
                name: product.name,
                slug: product.slug,
                image: product.featuredImage || product.images?.[0] || '',
                price: product.pricing?.finalPrice || product.salePrice || product.price,
                categoryIds: product.categoryIds || [],
            };
            const { reason } = canAddToCompare(compareItem);
            return reason;
        })(),
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
        currency,
        templateId,
        cardConfig: themeConfig?.productCard,
        layout,
        isLoggedIn,
        userId,
        shippingEstimate,
        userDefaultCountry,
        onCalculateShipping: handleCalculateShipping,
    };

    return <ProductPageTemplate {...templateProps} />;
}
