// Modern Clean ProductCard Template - Pure presentation
// Premium design with hover effects, quick actions, and responsive styling

'use client';

import React from 'react';
import Link from 'next/link';
import { ProductTemplateProps } from '@/components/templates/core/ProductCard/types';
import { ProductCardConfig } from '@/types';
import styles from './ProductCard.module.scss';
import ImageWithDimensions from '@/components/core/common/ImageWithDimensions';
import PriceDisplay from '@/components/core/common/PriceDisplay';
import { usePriceVisibility } from '@/hooks/usePriceVisibility';

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
    isInCompare?: boolean;
    showCompare?: boolean;
    compareDisabled?: boolean;
    compareDisabledReason?: string;
}

export default function ModernCleanProductCardTemplate({
    id,
    name,
    price,
    currency,
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
    isInCompare = false,
    showCompare = false,
    compareDisabled = false,
    compareDisabledReason,
}: ExtendedProductTemplateProps) {
    // Extract config with defaults
    const {
        cardStyle = 'default',
    } = cardConfig || {};
    // Define style-specific defaults
    const getStyleDefaults = (style: string) => {
        switch (style) {
            case 'detailed':
                return {
                    cardBorderRadius: 16,
                    cardPadding: 0, // Padding handled internally to allow full-width footer
                    titleFontSize: 'large' as const,
                    showStock: true,
                    showSku: true,
                    addToCartStyle: 'filled' as const,
                    showRating: true
                };
            case 'compact':
                return {
                    cardBorderRadius: 8,
                    cardPadding: 0, // Adjusted locally
                    titleFontSize: 'small' as const,
                    showRating: false,
                    addToCartStyle: 'icon-only' as const,
                    showQuickView: false,
                    showStock: false,
                    showSku: false
                };
            case 'glassmorphism':
                return {
                    cardBorderRadius: 20,
                    cardPadding: 16,
                    titleFontSize: 'medium' as const,
                    showStock: false,
                    showSku: false,
                    addToCartStyle: 'filled' as const,
                    showRating: true
                };
            case 'neon':
                return {
                    cardBorderRadius: 12,
                    cardPadding: 16,
                    titleFontSize: 'medium' as const,
                    showStock: false,
                    showSku: false,
                    addToCartStyle: 'filled' as const,
                    showRating: true
                };
            case 'magazine':
                return {
                    cardBorderRadius: 0,
                    cardPadding: 0,
                    titleFontSize: 'large' as const,
                    showStock: false,
                    showSku: false,
                    addToCartStyle: 'filled' as const,
                    showRating: false
                };
            case 'polaroid':
                return {
                    cardBorderRadius: 4,
                    cardPadding: 12,
                    titleFontSize: 'medium' as const,
                    showStock: false,
                    showSku: false,
                    addToCartStyle: 'filled' as const,
                    showRating: true
                };
            case 'gradient':
                return {
                    cardBorderRadius: 16,
                    cardPadding: 16,
                    titleFontSize: 'medium' as const,
                    showStock: false,
                    showSku: false,
                    addToCartStyle: 'filled' as const,
                    showRating: true
                };
            case 'elegant':
                return {
                    cardBorderRadius: 2,
                    cardPadding: 20,
                    titleFontSize: 'large' as const,
                    showStock: true,
                    showSku: false,
                    addToCartStyle: 'outlined' as const,
                    showRating: true
                };
            case 'brutalist':
                return {
                    cardBorderRadius: 0,
                    cardPadding: 0,
                    titleFontSize: 'large' as const,
                    showStock: true,
                    showSku: true,
                    addToCartStyle: 'filled' as const,
                    showRating: true
                };
            case 'floating':
                return {
                    cardBorderRadius: 24,
                    cardPadding: 16,
                    titleFontSize: 'medium' as const,
                    showStock: false,
                    showSku: false,
                    addToCartStyle: 'filled' as const,
                    showRating: true
                };
            default:
                return {
                    cardBorderRadius: 12,
                    cardPadding: 12,
                    titleFontSize: 'medium' as const,
                    showStock: false,
                    showSku: false,
                    addToCartStyle: 'filled' as const
                };
        }
    };

    const styleDefaults = getStyleDefaults(cardStyle);

    const {
        hoverEffect = 'lift',
        cardBorderRadius = styleDefaults.cardBorderRadius,
        cardPadding = styleDefaults.cardPadding,
        imageAspectRatio = '3:4',
        // Button visibility
        showAddToCart = true,
        showBuyNow = false,
        showWishlist = true,
        showQuickView = styleDefaults.showQuickView ?? true,
        showCompare: showCompareConfig = false,
        // Button styles
        addToCartStyle = styleDefaults.addToCartStyle,
        buyNowStyle = 'outlined',
        wishlistPosition = 'top-right',
        quickViewPosition = 'overlay',
        // Typography
        titleLines = 2,
        titleFontSize = styleDefaults.titleFontSize,
        titleFontWeight = 'medium',
        priceFontSize = 'medium',
        // Display options
        showBrand = true,
        showRating = styleDefaults.showRating ?? true,
        showRatingValue = true,
        showSalePercent = true,
        showStock = styleDefaults.showStock,
        showSku = styleDefaults.showSku,
    } = cardConfig || {};

    const { shouldShowPrice, contactUsLink } = usePriceVisibility();

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
        styles[`btn${buyNowStyle.charAt(0).toUpperCase() + buyNowStyle.slice(1).replace('-', '')}`],
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
                {showRatingValue && (
                    <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
                )}
                <div className={styles.stars}>{stars}</div>
                {reviewCount !== undefined && reviewCount > 0 && (
                    <span className={styles.reviewCount}>({reviewCount})</span>
                )}
            </div>
        );
    };

    const isHorizontal = cardStyle === 'horizontal';

    return (
        <div
            className={cardClasses}
            style={{
                '--card-border-radius': `${cardBorderRadius}px`,
                '--card-padding': `${cardPadding}px`,
                ...(isHorizontal ? { flexDirection: 'row' as const, flexWrap: 'nowrap' as const } : {}),
            } as React.CSSProperties}
            data-ga-location="product_card"
            data-ga-category="product"
            data-ga-value={id}
        >

            {/* Image Container */}
            <Link
                href={productUrl}
                title={name}
                className={`${styles.imageLink} infi-track`}
                style={isHorizontal ? { width: '40%', minWidth: '40%', maxWidth: '40%', flexShrink: 0, display: 'block' } : undefined}
                data-ga-label={name}
            >
                <div className={`${styles.imageContainer} ${aspectRatioClass}`}>

                    <div className={styles.imageInner}>
                        <ImageWithDimensions
                            src={imageUrl}
                            alt={imageAlt || name}
                            aspectRatio={imageAspectRatio.replace(':', 'x') as any}
                            fill
                            className={styles.image}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                    </div>

                    {/* Badges */}
                    <div className={styles.badges}>
                        {!inStock && (
                            <span className={`${styles.badge} ${styles.badgeOutOfStock}`}>
                                Out of Stock
                            </span>
                        )}
                        {showSalePercent && hasDiscount && discountPercent !== undefined && discountPercent > 0 && inStock && (
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

                    {/* Compact Style Overlay Actions */}
                    {(cardStyle as any) === 'compact' && showAddToCart && inStock && (
                        <button
                            className={`${styles.compactAddBtn} infi-track`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAddToCart?.();
                            }}
                            aria-label="Add to Cart"
                            data-ga-action="add_to_cart"
                            data-ga-label={name}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </button>
                    )}
                    {/* Quick Action Icons - Top Right */}
                    <div className={styles.quickIcons}>
                        {showQuickView && quickViewPosition === 'top-right' && (
                            <button
                                className={`${styles.iconBtn} infi-track`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onQuickView?.();
                                }}
                                aria-label="Quick view"
                                title="Quick View"
                                data-ga-action="quick_view"
                                data-ga-label={name}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        )}
                        {showCompare && (
                            <button
                                className={`${styles.iconBtn} ${isInCompare ? styles.inCompare : ''} ${compareDisabled ? styles.disabled : ''} infi-track`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!compareDisabled) {
                                        onCompare?.();
                                    }
                                }}
                                aria-label={compareDisabled ? compareDisabledReason : (isInCompare ? 'Remove from Compare' : 'Add to Compare')}
                                title={compareDisabled ? compareDisabledReason : (isInCompare ? 'Remove from Compare' : 'Add to Compare')}
                                disabled={compareDisabled}
                                data-ga-action={isInCompare ? 'remove_from_compare' : 'add_to_compare'}
                                data-ga-label={name}
                            >
                                <svg viewBox="0 0 24 24" fill={isInCompare ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </button>
                        )}
                        {showWishlist && wishlistPosition === 'top-right' && (
                            <button
                                className={`${styles.iconBtn} ${isWishlisted ? styles.wishlisted : ''} infi-track`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleWishlist?.();
                                }}
                                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                data-ga-action={isWishlisted ? 'remove_from_wishlist' : 'add_to_wishlist'}
                                data-ga-label={name}
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
                            className={`${styles.wishlistBtn} ${styles[wishlistPosition]} ${isWishlisted ? styles.wishlisted : ''} infi-track`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleWishlist?.();
                            }}
                            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            data-ga-action={isWishlisted ? 'remove_from_wishlist' : 'add_to_wishlist'}
                            data-ga-label={name}
                        >
                            <svg viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    )}

                    {/* Quick Actions Overlay - For overlay and magazine styles */}
                    {(((cardStyle === 'overlay' || cardStyle === 'magazine') && (showAddToCart || showBuyNow)) || (showQuickView && quickViewPosition === 'overlay')) && inStock && shouldShowPrice && (
                        <div className={`${styles.quickActions} ${((cardStyle === 'overlay' || cardStyle === 'magazine') && showAddToCart && showBuyNow) ? styles.stacked : ''}`}>
                            {(cardStyle === 'overlay' || cardStyle === 'magazine') && (
                                <div className={styles.actionButtons}>
                                    {showAddToCart && (
                                        <button
                                            className={`${addToCartBtnClasses} infi-track`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onAddToCart?.();
                                            }}
                                            title="Add to Cart"
                                            data-ga-action="add_to_cart"
                                            data-ga-label={name}
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
                                            className={`${buyNowBtnClasses} infi-track`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onBuyNow?.();
                                            }}
                                            title="Buy Now"
                                            data-ga-action="buy_now"
                                            data-ga-label={name}
                                        >
                                            {buyNowStyle === 'icon-only' ? (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            ) : (
                                                'Buy Now'
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                            {showQuickView && quickViewPosition === 'overlay' && (
                                <button
                                    className={`${styles.quickViewBtn} infi-track`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onQuickView?.();
                                    }}
                                    aria-label="Quick view"
                                    title="Quick View"
                                    data-ga-action="quick_view"
                                    data-ga-label={name}
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
            </Link>
            {/* Content */}
            <div className={styles.content} style={isHorizontal ? { flex: '1 1 0%', minWidth: 0, width: '60%' } : undefined}>
                {/* Brand */}
                {showBrand && brand && (
                    <span className={styles.brand}>{brand}</span>
                )}

                <h3 className={nameClasses}>
                    <Link
                        href={productUrl}
                        className="infi-track"
                        data-ga-label={name}
                    >{name}</Link>
                </h3>

                {/* SKU */}
                {showSku && sku && (
                    <span className={styles.sku}>SKU: {sku}</span>
                )}

                {renderStars()}

                {/* Pricing */}
                <PriceDisplay>
                    <div className={styles.pricing}>
                        <span className={priceClasses}>
                            {formattedPrice}
                        </span>
                        {hasDiscount && formattedCompareAtPrice && (
                            <span className={styles.comparePrice}>{formattedCompareAtPrice}</span>
                        )}
                    </div>
                </PriceDisplay>

                {/* Stock Status */}
                {showStock && (
                    <span className={`${styles.stockStatus} ${inStock ? styles.inStock : styles.outOfStockText}`}>
                        {formatStockStatus(stockStatus)}
                    </span>
                )}

                {/* Action Buttons - For non-overlay card styles */}
                {cardStyle !== 'overlay' && cardStyle !== 'magazine' && (cardStyle as any) !== 'detailed' && cardStyle !== 'brutalist' && cardStyle !== 'elegant' && (showAddToCart || showBuyNow) && inStock && shouldShowPrice && (
                    <div className={`${styles.contentActions} ${(addToCartStyle === 'icon-only' && buyNowStyle === 'icon-only') ? styles.centeredActions : ''}`}>
                        {showAddToCart && (
                            <button
                                className={`${styles.contentBtn} ${styles.addToCart} ${styles[`contentBtn${addToCartStyle.charAt(0).toUpperCase() + addToCartStyle.slice(1).replace('-', '')}`]} infi-track`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onAddToCart?.();
                                }}
                                data-ga-action="add_to_cart"
                                data-ga-label={name}
                                title={addToCartStyle === 'icon-only' ? 'Add to Cart' : undefined}
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
                                className={`${styles.contentBtn} ${styles.buyNow} ${styles[`contentBtn${buyNowStyle.charAt(0).toUpperCase() + buyNowStyle.slice(1).replace('-', '')}`]} infi-track`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onBuyNow?.();
                                }}
                                data-ga-action="buy_now"
                                data-ga-label={name}
                                title={buyNowStyle === 'icon-only' ? 'Buy Now' : undefined}
                            >
                                {buyNowStyle === 'icon-only' ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                ) : (
                                    'Buy Now'
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Detailed Style Footer */}
            {(cardStyle as any) === 'detailed' && (showAddToCart || showBuyNow) && inStock && shouldShowPrice && (
                <div className={styles.detailedFooter}>
                    {showAddToCart && (
                        <button
                            className={`${styles.footerBtn} ${styles.footerBtnCart} infi-track`}
                            onClick={(e) => {
                                e.preventDefault();
                                onAddToCart?.();
                            }}
                            data-ga-action="add_to_cart"
                            data-ga-label={name}
                        >
                            Add to Cart
                        </button>
                    )}
                    {showBuyNow && (
                        <button
                            className={`${styles.footerBtn} ${styles.footerBtnBuy} infi-track`}
                            onClick={(e) => {
                                e.preventDefault();
                                onBuyNow?.();
                            }}
                            data-ga-action="buy_now"
                            data-ga-label={name}
                        >
                            Buy Now
                        </button>
                    )}
                </div>
            )}

            {/* Brutalist Style Footer */}
            {cardStyle === 'brutalist' && (showAddToCart || showBuyNow) && inStock && shouldShowPrice && (
                <div className={styles.brutalistFooter}>
                    {showAddToCart && (
                        <button
                            className={`${styles.brutalistBtn} ${styles.brutalistBtnCart} infi-track`}
                            onClick={(e) => {
                                e.preventDefault();
                                onAddToCart?.();
                            }}
                            data-ga-action="add_to_cart"
                            data-ga-label={name}
                        >
                            ADD TO CART
                        </button>
                    )}
                    {showBuyNow && (
                        <button
                            className={`${styles.brutalistBtn} ${styles.brutalistBtnBuy} infi-track`}
                            onClick={(e) => {
                                e.preventDefault();
                                onBuyNow?.();
                            }}
                            data-ga-action="buy_now"
                            data-ga-label={name}
                        >
                            BUY NOW
                        </button>
                    )}
                </div>
            )}

            {/* Elegant Style Footer */}
            {cardStyle === 'elegant' && (showAddToCart || showBuyNow) && inStock && shouldShowPrice && (
                <div className={styles.elegantFooter}>
                    {showAddToCart && (
                        <button
                            className={`${styles.elegantBtn} ${styles.elegantBtnCart} infi-track`}
                            onClick={(e) => {
                                e.preventDefault();
                                onAddToCart?.();
                            }}
                            data-ga-action="add_to_cart"
                            data-ga-label={name}
                        >
                            Add to Cart
                        </button>
                    )}
                    {showBuyNow && (
                        <button
                            className={`${styles.elegantBtn} ${styles.elegantBtnBuy} infi-track`}
                            onClick={(e) => {
                                e.preventDefault();
                                onBuyNow?.();
                            }}
                            data-ga-action="buy_now"
                            data-ga-label={name}
                        >
                            Buy Now
                        </button>
                    )}
                </div>
            )}

            {/* Contact Us button when price is hidden */}
            {!shouldShowPrice && (showAddToCart || showBuyNow) && (
                <div className={styles.contentActions}>
                    <a
                        href={contactUsLink}
                        className={`${styles.contentBtn} ${styles.addToCart}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ textAlign: 'center', textDecoration: 'none' }}
                    >
                        Contact Us
                    </a>
                </div>
            )}
        </div>
    );
}
