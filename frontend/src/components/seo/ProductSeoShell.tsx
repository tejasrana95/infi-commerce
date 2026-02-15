// Server Component - Renders SEO-critical HTML for crawlers
// This content appears in "View Page Source" and is indexable by search engines

import { Store } from '@/types';
import Link from 'next/link';

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
            {/* Breadcrumb Navigation (improved appearance + SEO microdata) */}
            {(() => {
                const breadcrumbs: Array<{ label: string; href?: string }> = [];
                breadcrumbs.push({ label: 'Home', href: '/' });

                if (product.categoryBreadcrumbs && product.categoryBreadcrumbs.length > 0) {
                    product.categoryBreadcrumbs.forEach((c: any) => {
                        if (c && c.label && c.href) breadcrumbs.push({ label: c.label, href: c.href });
                    });
                } else if (product.categories && product.categories.length > 0) {
                    const c = product.categories[0];
                    if (c && c.slug && c.title) breadcrumbs.push({ label: c.title, href: `/${c.slug}` });
                }

                breadcrumbs.push({ label: product.name });

                const truncate = (s: string, n = 60) => (s && s.length > n) ? s.substring(0, n - 1).trim() + '\u2026' : s;

                const itemStyle = {
                    display: 'inline-block',
                    maxWidth: '360px',
                    verticalAlign: 'middle',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                };

                return (
                    <nav aria-label="Breadcrumb">
                        <ol itemScope itemType="https://schema.org/BreadcrumbList" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {breadcrumbs.map((bc, idx) => (
                                <li
                                    key={idx}
                                    itemProp="itemListElement"
                                    itemScope
                                    itemType="https://schema.org/ListItem"
                                    style={{ display: 'inline' }}
                                >
                                    {bc.href ? (
                                        <Link href={bc.href} itemProp="item">
                                            <span itemProp="name" style={itemStyle}>{truncate(bc.label)}</span>
                                        </Link>
                                    ) : (
                                        <span aria-current="page" itemProp="name" style={itemStyle}>{truncate(bc.label)}</span>
                                    )}
                                    <meta itemProp="position" content={(idx + 1).toString()} />
                                    {idx < breadcrumbs.length - 1 && (
                                        <span aria-hidden="true" style={{ margin: '0 8px' }}> / </span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                );
            })()}

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
