'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ComparePageTemplateProps, CompareProduct, CompareAttribute } from '../../core/ComparePage/types';
import styles from './ComparePage.module.scss';

// ============================================
// Icons
// ============================================

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
);

const CartIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);

const HeartIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

// ============================================
// Helper Components
// ============================================

const RatingStars = ({ rating, reviewCount }: { rating?: number; reviewCount?: number }) => {
    const stars = [];
    const ratingValue = rating || 0;

    for (let i = 1; i <= 5; i++) {
        stars.push(<StarIcon key={i} filled={i <= Math.round(ratingValue)} />);
    }

    return (
        <div className={styles.rating}>
            <div className={styles.stars}>{stars}</div>
            {reviewCount !== undefined && (
                <span className={styles.reviewCount}>({reviewCount})</span>
            )}
        </div>
    );
};

const StockBadge = ({ status }: { status: string }) => {
    const statusMap: Record<string, { label: string; className: string }> = {
        in_stock: { label: 'In Stock', className: styles.inStock },
        out_of_stock: { label: 'Out of Stock', className: styles.outOfStock },
        on_backorder: { label: 'Pre-Order', className: styles.backorder },
        made_to_order: { label: 'Made to Order', className: styles.madeToOrder },
    };

    const { label, className } = statusMap[status] || { label: status, className: '' };

    return <span className={`${styles.stockBadge} ${className}`}>{label}</span>;
};

// ============================================
// Empty State Component
// ============================================

const EmptyState = () => (
    <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
            </svg>
        </div>
        <h2 className={styles.emptyTitle}>No Products to Compare</h2>
        <p className={styles.emptyText}>
            Add at least 2 products to compare their features and specifications.
        </p>
        <Link href="/" className={styles.browseBtn}>
            Browse Products
        </Link>
    </div>
);

// ============================================
// Minimum Products State
// ============================================

const MinimumProductsState = ({ count }: { count: number }) => (
    <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" opacity="0.3" />
            </svg>
        </div>
        <h2 className={styles.emptyTitle}>Add More Products</h2>
        <p className={styles.emptyText}>
            You have {count} product{count > 1 ? 's' : ''} in your compare list.
            Add at least {2 - count} more to start comparing.
        </p>
        <Link href="/" className={styles.browseBtn}>
            Browse Products
        </Link>
    </div>
);

// ============================================
// Loading State
// ============================================

const LoadingState = () => (
    <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading comparison data...</p>
    </div>
);

// ============================================
// Main Template Component
// ============================================

export default function ComparePageTemplate({
    products,
    comparisonAttributes,
    config,
    formatPrice,
    currencySymbol,
    isLoading,
    error,
    onRemoveProduct,
    onClearAll,
    onViewProduct,
    onAddToCart,
    onAddToWishlist,
}: ComparePageTemplateProps) {
    // Handle loading state
    if (isLoading) {
        return (
            <div className={styles.comparePage}>
                <div className={styles.container}>
                    <LoadingState />
                </div>
            </div>
        );
    }

    // Handle empty state
    if (products.length === 0) {
        return (
            <div className={styles.comparePage}>
                <div className={styles.container}>
                    <EmptyState />
                </div>
            </div>
        );
    }

    // Handle minimum products state
    if (products.length === 1) {
        return (
            <div className={styles.comparePage}>
                <div className={styles.container}>
                    <MinimumProductsState count={1} />
                </div>
            </div>
        );
    }

    // Find lowest price for highlighting
    const lowestPrice = Math.min(...products.map(p => p.pricing.finalPrice));
    const highestRating = Math.max(...products.map(p => p.averageRating || 0));

    return (
        <div className={styles.comparePage}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Compare Products</h1>
                        <p className={styles.subtitle}>
                            Comparing {products.length} products
                        </p>
                    </div>
                    <button className={styles.clearAllBtn} onClick={onClearAll}>
                        <TrashIcon />
                        Clear All
                    </button>
                </div>

                {/* Error message */}
                {error && (
                    <div className={styles.errorBanner}>
                        {error}
                    </div>
                )}

                {/* Comparison Table */}
                <div className={styles.tableWrapper}>
                    <table className={styles.compareTable}>
                        <tbody>
                            {/* Product Images Row */}
                            <tr className={styles.imageRow}>
                                <th className={styles.rowLabel}>Product</th>
                                {products.map((product) => (
                                    <td key={product._id} className={styles.productCell}>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => onRemoveProduct(product._id)}
                                            aria-label="Remove from compare"
                                        >
                                            <CloseIcon />
                                        </button>
                                        <div
                                            className={styles.productImage}
                                            onClick={() => onViewProduct(product.slug)}
                                        >
                                            {product.featuredImage ? (
                                                <Image
                                                    src={product.featuredImage}
                                                    alt={product.name}
                                                    width={200}
                                                    height={200}
                                                    style={{ objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <div className={styles.noImage}>No Image</div>
                                            )}
                                        </div>
                                        <h3
                                            className={styles.productName}
                                            onClick={() => onViewProduct(product.slug)}
                                        >
                                            {product.name}
                                        </h3>
                                    </td>
                                ))}
                            </tr>

                            {/* Price Row */}
                            <tr className={styles.priceRow}>
                                <th className={styles.rowLabel}>Price</th>
                                {products.map((product) => (
                                    <td
                                        key={product._id}
                                        className={`${styles.priceCell} ${product.pricing.finalPrice === lowestPrice ? styles.highlight : ''
                                            }`}
                                    >
                                        <div className={styles.priceWrapper}>
                                            <span className={styles.currentPrice}>
                                                {formatPrice(product.pricing.finalPrice)}
                                            </span>
                                            {product.isOnSale && product.pricing.regularPrice > product.pricing.finalPrice && (
                                                <span className={styles.originalPrice}>
                                                    {formatPrice(product.pricing.regularPrice)}
                                                </span>
                                            )}
                                        </div>
                                        {product.pricing.finalPrice === lowestPrice && (
                                            <span className={styles.bestValueBadge}>Best Price</span>
                                        )}
                                    </td>
                                ))}
                            </tr>

                            {/* Rating Row */}
                            <tr>
                                <th className={styles.rowLabel}>Rating</th>
                                {products.map((product) => (
                                    <td
                                        key={product._id}
                                        className={`${styles.ratingCell} ${product.averageRating === highestRating && highestRating > 0
                                            ? styles.highlight
                                            : ''
                                            }`}
                                    >
                                        <RatingStars rating={product.averageRating} reviewCount={product.reviewCount} />
                                    </td>
                                ))}
                            </tr>

                            {/* Brand Row */}
                            <tr>
                                <th className={styles.rowLabel}>Brand</th>
                                {products.map((product) => (
                                    <td key={product._id}>
                                        {product.brand?.name || '—'}
                                    </td>
                                ))}
                            </tr>

                            {/* Stock Row */}
                            <tr>
                                <th className={styles.rowLabel}>Availability</th>
                                {products.map((product) => (
                                    <td key={product._id}>
                                        <StockBadge status={product.stockStatus} />
                                    </td>
                                ))}
                            </tr>

                            {/* SKU Row */}
                            <tr>
                                <th className={styles.rowLabel}>SKU</th>
                                {products.map((product) => (
                                    <td key={product._id} className={styles.skuCell}>
                                        {product.sku}
                                    </td>
                                ))}
                            </tr>

                            {/* Weight Row */}
                            {products.some(p => p.weight) && (
                                <tr>
                                    <th className={styles.rowLabel}>Weight</th>
                                    {products.map((product) => (
                                        <td key={product._id}>
                                            {product.weight ? `${product.weight} g` : '—'}
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {/* Dimensions Row */}
                            {products.some(p => p.dimensions?.length || p.dimensions?.width || p.dimensions?.height) && (
                                <tr>
                                    <th className={styles.rowLabel}>Dimensions</th>
                                    {products.map((product) => (
                                        <td key={product._id}>
                                            {product.dimensions?.length && product.dimensions?.width && product.dimensions?.height
                                                ? `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} ${product.dimensions.unit}`
                                                : '—'}
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {/* Specification Rows */}
                            {comparisonAttributes.map((attr) => (
                                <tr key={attr.id}>
                                    <th className={styles.rowLabel}>{attr.name}</th>
                                    {products.map((product) => {
                                        const spec = product.specifications?.[attr.slug];
                                        let displayValue = '—';

                                        if (spec) {
                                            if (Array.isArray(spec.value)) {
                                                displayValue = spec.value.join(', ');
                                            } else if (typeof spec.value === 'boolean') {
                                                displayValue = spec.value ? '✓' : '✗';
                                            } else {
                                                displayValue = String(spec.value);
                                            }
                                        }

                                        return (
                                            <td key={product._id} className={styles.specCell}>
                                                {displayValue}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}

                            {/* Actions Row */}
                            <tr className={styles.actionsRow}>
                                <th className={styles.rowLabel}>Actions</th>
                                {products.map((product) => (
                                    <td key={product._id} className={styles.actionsCell}>
                                        <div className={styles.actionButtonsContainer}>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    className={styles.addToCartBtn}
                                                    onClick={() => onAddToCart(product._id)}
                                                    disabled={product.stockStatus === 'out_of_stock'}
                                                >
                                                    <CartIcon />
                                                    Add to Cart
                                                </button>
                                                <button
                                                    className={styles.wishlistBtn}
                                                    onClick={() => onAddToWishlist(product._id)}
                                                >
                                                    <HeartIcon />
                                                </button>
                                            </div>
                                            <Link
                                                href={`/${product.slug}`}
                                                className={styles.viewDetailsLink}
                                            >
                                                View Details →
                                            </Link>
                                        </div>
                                    </td>

                                ))}

                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
