// Server Component - Renders SEO-critical HTML for crawlers
// This content appears in "View Page Source" and is indexable by search engines

import { Store } from '@/types';

interface ProductSeoShellProps {
    product: any;
    store: Store;
}

/**
 * ProductSeoShell - Server-rendered HTML for SEO
 * 
 * This component outputs real HTML elements (h1, img, p, span) that are:
 * - Visible in "View Page Source"
 * - Indexable by Google, Bing, and other crawlers
 * - Enhanced with microdata (schema.org) for rich snippets
 * 
 * The content is visually hidden after hydration since the client
 * component renders the interactive version.
 */
export default function ProductSeoShell({ product, store }: ProductSeoShellProps) {
    const effectivePrice = product.isOnSale && product.salePrice
        ? product.salePrice
        : product.price;
    const featuredImage = product.featuredImage || product.images?.[0];
    const currencySymbol = store?.currency === 'INR' ? '₹' : '$';

    // Determine availability schema
    const availabilitySchema = product.stockStatus === 'in_stock'
        ? 'https://schema.org/InStock'
        : product.stockStatus === 'on_backorder'
            ? 'https://schema.org/BackOrder'
            : 'https://schema.org/OutOfStock';

    return (
        <article
            className="sr-only"
            itemScope
            itemType="https://schema.org/Product"
            aria-hidden="true"
        >
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb">
                <ol>
                    <li><a href="/">Home</a></li>
                    {product.categories?.[0] && (
                        <li>
                            <a href={`/category/${product.categories[0].slug}`}>
                                {product.categories[0].title}
                            </a>
                        </li>
                    )}
                    <li aria-current="page">{product.name}</li>
                </ol>
            </nav>

            {/* Product Name - Critical for SEO */}
            <h1 itemProp="name">{product.name}</h1>

            {/* Brand */}
            {product.brand && (
                <span itemProp="brand" itemScope itemType="https://schema.org/Brand">
                    <span itemProp="name">
                        {typeof product.brand === 'object' ? product.brand.name : product.brand}
                    </span>
                </span>
            )}

            {/* Featured Image - Critical for SEO */}
            {featuredImage && (
                <img
                    src={featuredImage}
                    alt={product.name}
                    itemProp="image"
                    width={600}
                    height={600}
                />
            )}

            {/* Price with Offer microdata */}
            <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
                <span itemProp="price" content={effectivePrice.toString()}>
                    {currencySymbol}{effectivePrice.toFixed(2)}
                </span>
                <meta itemProp="priceCurrency" content={store?.currency || 'USD'} />
                <link itemProp="availability" href={availabilitySchema} />
                {product.isOnSale && product.salePrice && (
                    <span className="sr-compare-price">
                        Was: {currencySymbol}{product.price.toFixed(2)}
                    </span>
                )}
            </div>

            {/* Short Description - Important for SEO snippets */}
            {product.shortDescription && (
                <p itemProp="description">{product.shortDescription}</p>
            )}

            {/* Full Description (truncated for SEO) */}
            {product.description && (
                <div itemProp="description">
                    {product.description.replace(/<[^>]*>/g, '').substring(0, 500)}
                </div>
            )}

            {/* SKU */}
            {product.sku && (
                <span itemProp="sku">SKU: {product.sku}</span>
            )}

            {/* Rating if available */}
            {product.reviewCount > 0 && product.averageRating && (
                <div itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                    <span itemProp="ratingValue">{product.averageRating.toFixed(1)}</span>
                    <span> out of </span>
                    <span itemProp="bestRating">5</span>
                    <span> based on </span>
                    <span itemProp="reviewCount">{product.reviewCount}</span>
                    <span> reviews</span>
                </div>
            )}
        </article>
    );
}
