'use client';

// Core ProductCard Container - Handles business logic and data processing
// Client Component to support dynamic currency updates

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getComponent } from '@/components/templates/registry';
import { ProductTemplateProps, Product } from './types';
import { useStore, useThemeConfig } from '@/providers/StoreProvider';
import { useWishlist } from '@/providers/WishlistProvider';
import { useCompare, CompareItem } from '@/providers/CompareProvider';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';
import { DEFAULT_PRODUCT_CARD_CONFIG, ProductCardConfig } from '@/types';
import { formatPrice } from '@/lib/currency';
import QuickViewModal from '@/components/organisms/QuickViewModal';

interface ProductCardContainerProps {
    product: Product;
    currency: import('@/types').Currency | string;
    templateId?: string;
    cardConfig?: Partial<ProductCardConfig>;
}

// Check if product is currently on sale (within date range)
function isWithinSalePeriod(saleStartDate?: string, saleEndDate?: string): boolean {
    const now = new Date();

    if (saleStartDate && new Date(saleStartDate) > now) {
        return false; // Sale hasn't started yet
    }

    if (saleEndDate && new Date(saleEndDate) < now) {
        return false; // Sale has ended
    }

    return true; // Within sale period or no date restrictions
}

function getBrandName(product: Product): string | undefined {
    if (typeof product.brand === 'object' && product.brand) {
        return product.brand.name;
    }
    return product.brandName || (typeof product.brand === 'string' ? product.brand : undefined);
}

// Process product data into template-ready props
function processProductData(product: Product, currency: import('@/types').Currency | string): ProductTemplateProps {
    // Calculate values based on currency exchange rate
    const rate = typeof currency === 'string' ? 1 : (currency.exchangeRate || 1);

    // If we have pricing object (from API with tax calculations), use it
    if (product.pricing) {
        const { finalPrice, originalPrice, isOnSale, discountPercent } = product.pricing;
        const currentPrice = finalPrice * rate;
        const compareAtPrice = isOnSale ? originalPrice * rate : undefined;

        return {
            id: product._id,
            name: product.name,
            slug: product.slug,
            brand: getBrandName(product),
            sku: product.sku,
            price: currentPrice,
            compareAtPrice,
            discountPercent: discountPercent ?? undefined,
            hasDiscount: isOnSale,
            formattedPrice: formatPrice(finalPrice, currency),
            formattedCompareAtPrice: compareAtPrice
                ? formatPrice(originalPrice, currency)
                : undefined,
            imageUrl: product.images?.[0],
            imageAlt: product.name,
            rating: product.rating ?? (product as any).averageRating,
            reviewCount: product.reviewCount,
            isNew: product.isNew,
            isOnSale,
            inStock: product.inStock ?? true,
            stockStatus: product.stockStatus,
            productUrl: `/${product.slug}`,
            currency: typeof currency === 'string' ? currency : currency.code || 'USD',
        };
    }

    // Fallback: Calculate from base prices (legacy path)
    const hasSalePrice = !!(product.salePrice && product.salePrice < product.price);
    const saleIsActive = hasSalePrice && isWithinSalePeriod(product.saleStartDate, product.saleEndDate);

    // Calculate prices
    const regularPrice = product.price * rate;
    const salePrice = product.salePrice ? product.salePrice * rate : undefined;
    const compareAtPrice = product.compareAtPrice ? product.compareAtPrice * rate : undefined;

    // If sale is active, use sale price as current price, regular price as compare at
    const currentPrice = saleIsActive && salePrice ? salePrice : regularPrice;
    const displayCompareAt = saleIsActive ? regularPrice : compareAtPrice;

    const hasDiscount = saleIsActive || !!(compareAtPrice && compareAtPrice > regularPrice);
    const discountPercent = hasDiscount && displayCompareAt
        ? Math.round((1 - currentPrice / displayCompareAt) * 100)
        : undefined;

    return {
        id: product._id,
        name: product.name,
        slug: product.slug,
        brand: getBrandName(product),
        sku: product.sku,
        price: currentPrice,
        compareAtPrice: displayCompareAt,
        discountPercent,
        hasDiscount,
        formattedPrice: formatPrice(currentPrice / rate, currency),
        formattedCompareAtPrice: displayCompareAt
            ? formatPrice(displayCompareAt / rate, currency)
            : undefined,
        imageUrl: product.images?.[0],
        imageAlt: product.name,
        rating: product.rating ?? (product as any).averageRating,
        reviewCount: product.reviewCount,
        isNew: product.isNew,
        isOnSale: saleIsActive,
        inStock: product.inStock ?? true,
        stockStatus: product.stockStatus,
        productUrl: `/${product.slug}`,
        currency: typeof currency === 'string' ? currency : currency.code || 'USD',
    };
}

// The Container component
export default function ProductCardContainer({
    product,
    currency: initialCurrency = 'USD',
    templateId = 'modern-clean',
    cardConfig,
}: ProductCardContainerProps) {
    const router = useRouter();
    const { store, currentCurrency } = useStore();
    const themeConfig = useThemeConfig();

    // Get wishlist functions from context (single API call for all products)
    const { isInWishlist, toggleWishlist } = useWishlist();

    // Get compare functions from context
    const { isInCompare, addToCompare, removeFromCompare, canAddToCompare, config: compareConfig } = useCompare();

    // Get cart functions from context
    const { addToCart } = useCart();
    const { success, error: toastError } = useToast();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [showQuickView, setShowQuickView] = useState(false);

    // Check if this product can be added to compare
    const compareItem: CompareItem = {
        id: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0] || '',
        price: product.pricing?.finalPrice || product.price,
        categoryIds: (product as any).categoryIds || [],
    };
    const { canAdd: canCompare, reason: compareReason } = canAddToCompare(compareItem);

    // Use context currency if available, otherwise fallback to prop
    const activeCurrency = currentCurrency || initialCurrency;

    // Get product card config from theme, merge with defaults
    const themeProductCardConfig = {
        ...DEFAULT_PRODUCT_CARD_CONFIG,
        ...themeConfig?.productCard,
    };

    // Prepare override, removing 'default' style if we want to inherit theme's non-default style
    const cardConfigOverride = { ...cardConfig };
    if (cardConfigOverride.cardStyle === 'default' && themeProductCardConfig.cardStyle && themeProductCardConfig.cardStyle !== 'default') {
        delete cardConfigOverride.cardStyle;
    }

    const productCardConfig: ProductCardConfig = {
        ...themeProductCardConfig,
        ...cardConfigOverride,
    };

    // Process the product data
    const templateProps = processProductData(product, activeCurrency);

    // Handle compare toggle
    const handleCompareToggle = () => {
        if (isInCompare(product._id)) {
            removeFromCompare(product._id);
        } else {
            addToCompare(compareItem);
        }
    };

    // Handle add to cart
    const handleAddToCart = useCallback(async () => {
        // For variable products, redirect to product page
        if ((product as any).type === 'variable') {
            router.push(`/${product.slug}`);
            return;
        }

        // For simple products, add to cart
        setIsAddingToCart(true);
        try {
            const result = await addToCart({
                productId: product._id,
                quantity: 1,
                storeId: store?._id || '',
            });

            if (result.success) {
                success(`${product.name} added to cart`);
            } else {
                toastError(`Failed to add to cart: ${result.error}`);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsAddingToCart(false);
        }
    }, [product, store?._id, addToCart, router]);

    // Handle buy now
    const handleBuyNow = useCallback(async () => {
        // For variable products, redirect to product page
        if ((product as any).type === 'variable') {
            router.push(`/${product.slug}`);
            return;
        }

        // For simple products, add to cart and redirect to checkout
        setIsAddingToCart(true);
        try {
            const result = await addToCart({
                productId: product._id,
                quantity: 1,
                storeId: store?._id || '',
            });

            if (result.success) {
                router.push('/checkout');
            } else {
                console.error('Failed to add to cart for Buy Now:', result.error);
            }
        } catch (error) {
            console.error('Error during Buy Now:', error);
        } finally {
            setIsAddingToCart(false);
        }
    }, [product, store?._id, addToCart, router]);

    // Get the template-specific presenter component
    const ProductCardTemplate = getComponent('ProductCardTemplate', templateId);

    // Render the template with processed data, config, and wishlist/compare props
    return (
        <>
            <ProductCardTemplate
                {...templateProps}
                cardConfig={productCardConfig}
                isWishlisted={isInWishlist(product._id)}
                onToggleWishlist={() => toggleWishlist(product._id)}
                isInCompare={isInCompare(product._id)}
                onCompare={handleCompareToggle}
                showCompare={compareConfig.enabled && compareConfig.showInProductCard && productCardConfig.showCompare}
                compareDisabled={!canCompare && !isInCompare(product._id)}
                compareDisabledReason={compareReason}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onQuickView={() => setShowQuickView(true)}
                isAddingToCart={isAddingToCart}
            />
            <QuickViewModal
                isOpen={showQuickView}
                onClose={() => setShowQuickView(false)}
                product={product}
                currency={activeCurrency}
            />
        </>
    );
}
