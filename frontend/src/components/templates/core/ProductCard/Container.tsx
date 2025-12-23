'use client';

// Core ProductCard Container - Handles business logic and data processing
// Client Component to support dynamic currency updates

import { getComponent } from '@/components/templates/registry';
import { ProductTemplateProps, Product } from './types';
import { useStore, useThemeConfig } from '@/providers/StoreProvider';
import { DEFAULT_PRODUCT_CARD_CONFIG, ProductCardConfig } from '@/types';
import { formatPrice } from '@/lib/currency';

interface ProductCardContainerProps {
    product: Product;
    currency?: import('@/types').Currency | string;
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
            brand: product.brandName || product.brand,
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
            rating: product.rating,
            reviewCount: product.reviewCount,
            isNew: product.isNew,
            isOnSale,
            inStock: product.inStock ?? true,
            stockStatus: product.stockStatus,
            productUrl: `/product/${product.slug}`,
            currency: typeof currency === 'string' ? currency : currency.code,
        };
    }

    // Fallback: Calculate from base prices (legacy path)
    // Determine if sale is active
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
        brand: product.brandName || product.brand,
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
        rating: product.rating,
        reviewCount: product.reviewCount,
        isNew: product.isNew,
        isOnSale: saleIsActive,
        inStock: product.inStock ?? true,
        stockStatus: product.stockStatus,
        productUrl: `/product/${product.slug}`,
        currency: typeof currency === 'string' ? currency : currency.code,
    };
}

// The Container component
export default function ProductCardContainer({
    product,
    currency: initialCurrency = 'USD', // Rename to avoid conflict
    templateId = 'modern-clean',
    cardConfig,
}: ProductCardContainerProps) {
    const { currentCurrency } = useStore();
    const themeConfig = useThemeConfig();

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
        const { cardStyle, ...rest } = cardConfigOverride;
        // Re-assign without cardStyle
        Object.assign(cardConfigOverride, rest);
        // actually delete is cleaner but TS might complain if strict. 
        // Let's just create a new object if needed or delete.
        delete cardConfigOverride.cardStyle;
    }

    const productCardConfig: ProductCardConfig = {
        ...themeProductCardConfig,
        ...cardConfigOverride,
    };

    // Process the product data
    const templateProps = processProductData(product, activeCurrency);

    // Get the template-specific presenter component
    const ProductCardTemplate = getComponent('ProductCardTemplate', templateId);

    // Render the template with processed data and config
    return <ProductCardTemplate {...templateProps} cardConfig={productCardConfig} />;
}
