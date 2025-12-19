'use client';

// Core ProductCard Container - Handles business logic and data processing
// Client Component to support dynamic currency updates

import { getComponent } from '@/components/templates/registry';
import { ProductTemplateProps, Product } from './types';
import { useStore } from '@/providers/StoreProvider';

interface ProductCardContainerProps {
    product: Product;
    currency?: string;
    templateId?: string;
}

// Format price based on currency object or code
function formatPrice(price: number, currency: import('@/types').Currency | string): string {
    if (typeof currency === 'string') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(price);
    }

    // Custom formatting using Currency object
    const val = price * (currency.exchangeRate || 1);
    const formatted = val.toFixed(currency.decimalPlaces || 2);

    // Add thousands separator if needed (simplified)
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator || ',');

    const result = parts.join(currency.decimalSeparator || '.');

    return currency.symbolPosition === 'after'
        ? `${result} ${currency.symbol}`
        : `${currency.symbol}${result}`;
}

// Process product data into template-ready props
function processProductData(product: Product, currency: import('@/types').Currency | string): ProductTemplateProps {
    // Calculate values based on currency exchange rate
    const rate = typeof currency === 'string' ? 1 : (currency.exchangeRate || 1);
    const price = product.price * rate;
    const compareAtPrice = product.compareAtPrice ? product.compareAtPrice * rate : undefined;

    const hasDiscount = !!(compareAtPrice && compareAtPrice > price);
    const discountPercent = hasDiscount
        ? Math.round((1 - price / compareAtPrice!) * 100)
        : undefined;

    return {
        id: product._id,
        name: product.name,
        slug: product.slug,
        price: price,
        compareAtPrice: compareAtPrice,
        discountPercent,
        hasDiscount,
        formattedPrice: formatPrice(product.price, currency),
        formattedCompareAtPrice: product.compareAtPrice
            ? formatPrice(product.compareAtPrice, currency)
            : undefined,
        imageUrl: product.images?.[0],
        imageAlt: product.name,
        rating: product.rating,
        reviewCount: product.reviewCount,
        isNew: product.isNew,
        isOnSale: hasDiscount,
        inStock: product.inStock ?? true,
        productUrl: `/product/${product.slug}`,
        currency: typeof currency === 'string' ? currency : currency.code,
    };
}

// The Container component
export default function ProductCardContainer({
    product,
    currency: initialCurrency = 'USD', // Rename to avoid conflict
    templateId = 'modern-clean',
}: ProductCardContainerProps) {
    const { currentCurrency } = useStore();

    // Use context currency if available, otherwise fallback to prop
    const activeCurrency = currentCurrency || initialCurrency;

    // Process the product data
    const templateProps = processProductData(product, activeCurrency);

    // Get the template-specific presenter component
    const ProductCardTemplate = getComponent('ProductCardTemplate', templateId);

    // Render the template with processed data
    return <ProductCardTemplate {...templateProps} />;
}
