// Modern Clean ProductCard Template - Pure presentation
// Premium design with hover effects, quick actions, and responsive styling

'use client';

import React from 'react';
import Link from 'next/link';
import { ProductTemplateProps } from '@/components/templates/core/ProductCard/types';
import { ProductCardConfig } from '@/types';
import styles from './ProductCard.module.scss';

interface ExtendedProductTemplateProps extends ProductTemplateProps {
    cardConfig?: ProductCardConfig;
    brand?: string;
    sku?: string;
    stockStatus?: string;
    onAddToCart?: () => void;
    onBuyNow?: () => void;
    onToggleWishlist?: () => void;
    onQuickView?: () => void;
    onCompare?: () => void;
    isWishlisted?: boolean;
}

export default function ModernCleanProductCardTemplate({
    name,
    formattedPrice,
    formattedCompareAtPrice,
    hasDiscount,
    discountPercent,
    imageUrl,
    imageAlt,
    productUrl,
    rating,
    reviewCount,
    isNew,
    inStock = true,
    cardConfig,
    brand,
    sku,
    stockStatus,
    onAddToCart,
    onBuyNow,
    onToggleWishlist,
    onQuickView,
    onCompare,
    isWishlisted = false,
}: ExtendedProductTemplateProps) {
    // Extract config with defaults
    const {
        cardStyle = 'default',
        hoverEffect = 'lift',
        cardBorderRadius = 12,
        cardPadding = 12,
        imageAspectRatio = '3:4',
        // Button visibility
        showAddToCart = true,
        showBuyNow = false,
        showWishlist = true,
        showQuickView = true,
        showCompare = false,
        // Button styles
        addToCartStyle = 'filled',
        buyNowStyle = 'outlined',
        wishlistPosition = 'top-right',
        quickViewPosition = 'overlay',
        // Typography
        titleLines = 2,
        titleFontSize = 'medium',
        titleFontWeight = 'medium',
        priceFontSize = 'medium',
        // Display options
        showBrand = true,
        showRating = true,
        showSalePercent = true,
        showStock = false,
        showSku = false,
    } = cardConfig || {};

    // Build class names
    const cardClasses = [
        styles.card,
        styles[`style${cardStyle.charAt(0).toUpperCase() + cardStyle.slice(1)}`],
        styles[`hover${hoverEffect.charAt(0).toUpperCase() + hoverEffect.slice(1)}`],
        !inStock && styles.outOfStock,
    ].filter(Boolean).join(' ');

    const nameClasses = [
        styles.name,
        styles[`titleSize${titleFontSize.charAt(0).toUpperCase() + titleFontSize.slice(1)}`],
        styles[`titleWeight${titleFontWeight.charAt(0).toUpperCase() + titleFontWeight.slice(1)}`],
        styles[`titleLines${titleLines}`],
    ].filter(Boolean).join(' ');

    const priceClasses = [
        styles.price,
        styles[`priceSize${priceFontSize.charAt(0).toUpperCase() + priceFontSize.slice(1)}`],
        hasDiscount && styles.priceOnSale,
    ].filter(Boolean).join(' ');

    // Button style classes
    const addToCartBtnClasses = [
        styles.addToCartBtn,
        styles[`btn${addToCartStyle.charAt(0).toUpperCase() + addToCartStyle.slice(1).replace('-', '')}`],
    ].filter(Boolean).join(' ');

    const buyNowBtnClasses = [
        styles.buyNowBtn,
        styles[`btn${buyNowStyle.charAt(0).toUpperCase() + buyNowStyle.slice(1)}`],
    ].filter(Boolean).join(' ');

    // Get aspect ratio class
    const aspectRatioClass = styles[`aspect${imageAspectRatio.replace(':', 'x')}`] || styles.aspect3x4;

    // Format stock status (in_stock -> In Stock)
    const formatStockStatus = (status?: string): string => {
        if (!status) return inStock ? 'In Stock' : 'Out of Stock';
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Render star rating
    const renderStars = () => {
        if (!showRating || rating === undefined) return null;

        const fullStars = Math.floor(rating);
        const stars = [];

        for (let i = 0; i < 5; i++) {
            stars.push(
                <svg
                    key={i}
                    className={`${styles.star} ${i < fullStars ? styles.starFilled : styles.starEmpty}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            );
        }

        return (
            <div className={styles.rating}>
                <div className={styles.stars}>{stars}</div>
                {reviewCount !== undefined && reviewCount > 0 && (
                    <span className={styles.reviewCount}>({reviewCount})</span>
                )}
            </div>
        );
    };

    return (
        <div
            className={cardClasses}
            style={{
                '--card-border-radius': `${cardBorderRadius}px`,
                '--card-padding': `${cardPadding}px`,
            } as React.CSSProperties}
        >
            {/* Image Container */}
            <div className={`${styles.imageContainer} ${aspectRatioClass}`}>
                <div className={styles.imageInner}>
                    {imageUrl ? (
                        <Link href={productUrl}>
                            <img
                                src={imageUrl}
                                alt={imageAlt}
                                className={styles.image}
                            />
                        </Link>
                    ) : (
                        <div className={styles.placeholder}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Badges */}
                <div className={styles.badges}>
                    {!inStock && (
                        <span className={`${styles.badge} ${styles.badgeOutOfStock}`}>
                            Out of Stock
                        </span>
                    )}
                    {showSalePercent && hasDiscount && discountPercent && inStock && (
                        <span className={`${styles.badge} ${styles.badgeSale}`}>
                            -{discountPercent}%
                        </span>
                    )}
                    {isNew && inStock && (
                        <span className={`${styles.badge} ${styles.badgeNew}`}>
                            New
                        </span>
                    )}
                </div>
                {/* Quick Action Icons - Top Right */}
                <div className={styles.quickIcons}>
                    {showQuickView && quickViewPosition === 'top-right' && (
                        <button
                            className={styles.iconBtn}
                            onClick={(e) => {
                                e.preventDefault();
                                onQuickView?.();
                            }}
                            aria-label="Quick view"
                            title="Quick View"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    )}
                    {showCompare && (
                        <button
                            className={styles.iconBtn}
                            onClick={(e) => {
                                e.preventDefault();
                                onCompare?.();
                            }}
                            aria-label="Compare"
                            title="Compare"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </button>
                    )}
                    {showWishlist && wishlistPosition === 'top-right' && (
                        <button
                            className={`${styles.iconBtn} ${isWishlisted ? styles.wishlisted : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                onToggleWishlist?.();
                            }}
                            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                            <svg viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Wishlist Button - Other positions */}
                {showWishlist && wishlistPosition !== 'top-right' && (
                    <button
                        className={`${styles.wishlistBtn} ${styles[wishlistPosition]} ${isWishlisted ? styles.wishlisted : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            onToggleWishlist?.();
                        }}
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                        <svg viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                )}

                {/* Quick Actions Overlay - Only show cart/buy now buttons for overlay style */}
                {((cardStyle === 'overlay' && (showAddToCart || showBuyNow)) || (showQuickView && quickViewPosition === 'overlay')) && inStock && (
                    <div className={`${styles.quickActions} ${(cardStyle === 'overlay' && showAddToCart && showBuyNow) ? styles.stacked : ''}`}>
                        {cardStyle === 'overlay' && (
                            <div className={styles.actionButtons}>
                                {showAddToCart && (
                                    <button
                                        className={addToCartBtnClasses}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onAddToCart?.();
                                        }}
                                        title="Add to Cart"
                                    >
                                        {addToCartStyle === 'icon-only' ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        ) : (
                                            'Add to Cart'
                                        )}
                                    </button>
                                )}
                                {showBuyNow && (
                                    <button
                                        className={buyNowBtnClasses}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onBuyNow?.();
                                        }}
                                        title="Buy Now"
                                    >
                                        Buy Now
                                    </button>
                                )}
                            </div>
                        )}
                        {showQuickView && quickViewPosition === 'overlay' && (
                            <button
                                className={styles.quickViewBtn}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onQuickView?.();
                                }}
                                aria-label="Quick view"
                                title="Quick View"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={styles.content}>
                {/* Brand */}
                {showBrand && brand && (
                    <span className={styles.brand}>{brand}</span>
                )}

                <h3 className={nameClasses}>
                    <Link href={productUrl}>{name}</Link>
                </h3>

                {/* SKU */}
                {showSku && sku && (
                    <span className={styles.sku}>SKU: {sku}</span>
                )}

                {renderStars()}

                {/* Pricing */}
                <div className={styles.pricing}>
                    <span className={priceClasses}>
                        {formattedPrice}
                    </span>
                    {hasDiscount && formattedCompareAtPrice && (
                        <span className={styles.comparePrice}>{formattedCompareAtPrice}</span>
                    )}
                </div>

                {/* Stock Status */}
                {showStock && (
                    <span className={`${styles.stockStatus} ${inStock ? styles.inStock : styles.outOfStockText}`}>
                        {formatStockStatus(stockStatus)}
                    </span>
                )}

                {/* Action Buttons - For non-overlay card styles */}
                {cardStyle !== 'overlay' && (showAddToCart || showBuyNow) && inStock && (
                    <div className={styles.contentActions}>
                        {showAddToCart && (
                            <button
                                className={`${styles.contentBtn} ${styles[`contentBtn${addToCartStyle.charAt(0).toUpperCase() + addToCartStyle.slice(1).replace('-', '')}`]}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onAddToCart?.();
                                }}
                            >
                                {addToCartStyle === 'icon-only' ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                ) : (
                                    'Add to Cart'
                                )}
                            </button>
                        )}
                        {showBuyNow && (
                            <button
                                className={`${styles.contentBtn} ${styles[`contentBtn${buyNowStyle.charAt(0).toUpperCase() + buyNowStyle.slice(1)}`]}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onBuyNow?.();
                                }}
                            >
                                Buy Now
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
