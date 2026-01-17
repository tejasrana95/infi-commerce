// Modern Clean ProductPage Template - Premium presentation layer
// Features: Layout-driven rendering, variant selection, reviews, related products

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import ModuleRenderer from '@/components/core/layout/ModuleRenderer';
import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { ProductPageTemplateProps } from '@/components/templates/core/ProductPage/types';
import { getComponent } from '@/components/templates/registry';
import { addToRecentlyViewed } from '@/components/core/modules/standard/RecentlyViewed';

// Molecular Components
import { ProductGallery } from '@/components/molecules/ProductGallery';
import { ProductVariantSelector } from '@/components/molecules/ProductVariantSelector';
import { ProductSocialShare } from '@/components/molecules/ProductSocialShare';
import { ProductTabs } from '@/components/molecules/ProductTabs';
import { ProductVideoGallery } from '@/components/molecules/ProductVideoGallery';
import ShippingCalculator from '@/components/organisms/ShippingCalculator';

import styles from './ProductPage.module.scss';
import { formatPrice } from '@/lib/currency';
import api from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import { trackViewItem } from '@/lib/ga';
import { useStore } from '@/providers/StoreProvider';

export default function ModernCleanProductPageTemplate({
    product,
    breadcrumbs,
    selectedVariant,
    matchingVariant,
    selectedOptions,
    availableOptions,
    allOptionsSelected,
    onOptionChange,
    quantity,
    onQuantityChange,
    onAddToCart,
    onBuyNow,
    onAddToWishlist,
    isWishlisted = false,
    onAddToCompare,
    isInCompare = false,
    compareEnabled = true,
    compareDisabled = false,
    compareDisabledReason,
    isAddingToCart,

    reviews,
    reviewStats,
    reviewSettings,
    reviewsLoading,
    reviewsPagination,
    onLoadMoreReviews,
    onSubmitReview,
    isSubmittingReview,
    onHelpfulVote,
    userId,
    relatedProducts,
    config,
    currencySymbol,
    exchangeRate,
    currency,
    templateId,
    cardConfig,
    layout,
    isLoggedIn,
    shippingEstimate,
    userDefaultCountry,
    onCalculateShipping,
}: ProductPageTemplateProps) {
    const { error: toastError } = useToast();
    const { currentCurrency } = useStore();
    // Get ProductCard component
    const ProductCard = getComponent('ProductCard', templateId);

    // Review form state
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewFormData, setReviewFormData] = useState({
        rating: 5,
        title: '',
        content: '',
        guestName: '',
        guestEmail: '',
        images: [] as string[],
    });

    const [uploading, setUploading] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Validation
        if (!reviewSettings.allowImages) {
            toastError("Image uploads are not enabled.");
            return;
        }

        const currentCount = reviewFormData.images.length;
        const maxAllowed = reviewSettings.maxImagesPerReview || 3;

        if (currentCount + files.length > maxAllowed) {
            toastError(`You can only upload a maximum of ${maxAllowed} images.`);
            return;
        }

        // Upload
        setUploading(true);
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });
        formData.append('folder', `reviews/${product._id}`);

        try {
            const response = await api.upload('/files/upload', formData);

            if (response.files && response.files.length > 0) {
                const urls = response.files.map((f: any) => f.url);
                setReviewFormData(prev => ({
                    ...prev,
                    images: [...prev.images, ...urls]
                }));
            } else {
                toastError('Failed to upload images.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toastError('An error occurred while uploading.');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        setReviewFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // Main image state
    const [mainImageIndex, setMainImageIndex] = useState(0);


    // Get current variant for display (either fully selected or partial match for preview)
    const displayVariant = selectedVariant || matchingVariant;

    // Get current images (variant images or product images)
    const currentImages = displayVariant?.images?.length
        ? displayVariant.images
        : product.images;

    // Get current pricing (prefer variant pricing if available)
    const currentPricing = displayVariant?.pricing || product.pricing;
    const currentPrice = displayVariant?.price ?? product.price;
    const currentSalePrice = displayVariant?.salePrice ?? product.salePrice;

    // Tax-inclusive pricing
    const showTaxIncluded = config.pricing?.showTaxIncluded ?? false;
    const showPriceWithoutTax = config.pricing?.showPriceWithoutTax ?? false;

    // Determine display prices based on tax settings
    let displayPrice: number;
    let displaySalePrice: number | undefined;
    let displayComparePrice: number | undefined;

    if (showTaxIncluded && currentPricing) {
        // Show tax-inclusive prices
        displayPrice = currentPricing.priceWithTax;
        displaySalePrice = currentPricing.salePriceWithTax;
        displayComparePrice = currentPricing.salePrice ? currentPricing.priceWithTax : undefined;
    } else {
        // Show base prices (without tax)
        displayPrice = currentPrice;
        displaySalePrice = currentSalePrice;
        displayComparePrice = currentSalePrice && currentSalePrice < currentPrice ? currentPrice : undefined;
    }

    const effectivePrice = displaySalePrice && displaySalePrice < displayPrice
        ? displaySalePrice
        : displayPrice;
    const hasDiscount = displaySalePrice && displaySalePrice < displayPrice;

    // Stock status
    const effectiveStock = displayVariant?.stock ?? product.stock;

    // Determine effective status
    // Determine effective status
    let effectiveStatus: string = product.stockStatus || 'in_stock';
    if (product.manageStock) {
        if (effectiveStock <= 0) {
            effectiveStatus = ['on_backorder', 'pre_order'].includes(product.stockStatus || '')
                ? product.stockStatus!
                : 'out_of_stock';
        } else {
            // Stock > 0
            // If current status implies lack of immediate stock, flip to in_stock
            // But keep 'pre_order' and 'made_to_order' as they are business logic states
            const statusToFlip = ['out_of_stock', 'on_backorder', 'in_stock', 'low_stock'];
            if (statusToFlip.includes(product.stockStatus || '')) {
                if (product.lowStockThreshold && effectiveStock <= product.lowStockThreshold) {
                    effectiveStatus = 'low_stock';
                } else {
                    effectiveStatus = 'in_stock';
                }
            }
        }
    }

    // Determine if product can be ordered
    const canOrder = effectiveStatus !== 'out_of_stock';

    // Check if stock is limited (for quantity selector)
    const hasLimitedStock = product.manageStock && ['in_stock', 'low_stock'].includes(effectiveStatus || '');
    const maxQuantity = hasLimitedStock ? effectiveStock : 999;

    // Stock status display labels
    const stockStatusLabels: Record<string, string> = {
        'in_stock': 'In Stock',
        'out_of_stock': 'Out of Stock',
        'low_stock': 'Low Stock',
        'pre_order': 'Pre Order',
        'backorder': 'Backorder', // Renamed for display consistency if needed, checking standard
        'on_backorder': 'On Backorder',
        'made_to_order': 'Made to Order',
    };
    const stockLabel = stockStatusLabels[effectiveStatus || ''] || 'In Stock';
    const showStockCount = product.manageStock && ['in_stock', 'low_stock'].includes(effectiveStatus || '') && effectiveStock > 0;

    // ============================================
    // Track product view for "Recently Viewed" module
    // ============================================
    useEffect(() => {
        if (product._id) {
            addToRecentlyViewed(product._id);
        }
    }, [product._id]);

    // ============================================
    // Track product view for Google Analytics
    // ============================================
    useEffect(() => {
        if (product && currentCurrency) {
            const categoryName = product.categories?.[0]?.title || '';
            const brandName = product.brand && typeof product.brand === 'object'
                ? (product.brand as any)?.name
                : product.brand;

            trackViewItem({
                item_id: product._id,
                item_name: product.name,
                price: effectivePrice,
                item_category: categoryName,
                item_brand: brandName,
                item_variant: selectedVariant?.sku, // Use SKU instead of name
            }, currentCurrency.code || 'USD');
        }
    }, [product._id, selectedVariant?._id]); // Track on product change or variant selection

    // ============================================
    // Render Module Helper (for page-specific placeholders)
    // Passed to SectionRenderer for custom module handling
    // ============================================
    const renderModule = (module: any) => {
        if (!module) return null;

        // Check module type for placeholders and custom modules
        switch (module.type) {
            // Main product details placeholder - renders the core product components
            case 'product-details':
                return (
                    <React.Fragment key={module.id}>
                        <div className={styles.mainSection}>
                            {renderGallery()}
                            {renderProductInfo()}
                        </div>
                        {renderTabs()}
                    </React.Fragment>
                );

            // Individual component placeholders (for fine-grained control)
            case 'product-gallery':
                return <React.Fragment key={module.id}>{renderGallery()}</React.Fragment>;
            case 'product-info':
                return <React.Fragment key={module.id}>{renderProductInfo()}</React.Fragment>;
            case 'product-description':
                return <React.Fragment key={module.id}>{renderDescription()}</React.Fragment>;
            case 'product-specifications':
                return <React.Fragment key={module.id}>{renderSpecifications()}</React.Fragment>;
            case 'product-reviews':
                return <React.Fragment key={module.id}>{renderReviews()}</React.Fragment>;

            default:
                // Non-placeholder modules - use ModuleRenderer for layout builder modules
                // This includes 'related-products' and 'recently-viewed' modules
                // This includes 'related-products' and 'recently-viewed' modules
                return <ModuleRenderer key={module.id} module={module} />;
        }
    };

    // ============================================
    // Lightbox
    // ============================================
    const renderLightbox = () => {
        if (!lightboxImage || typeof document === 'undefined') return null;

        return createPortal(
            <div className={styles.lightboxOverlay} onClick={() => setLightboxImage(null)}>
                <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                    <button
                        className={styles.lightboxClose}
                        onClick={() => setLightboxImage(null)}
                    >
                        ×
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Review Full Size"
                        className={styles.lightboxImage}
                    />
                </div>
            </div>,
            document.body
        );
    };

    // ============================================
    // Product Gallery
    // ============================================
    const renderGallery = () => (
        <ProductGallery
            images={currentImages}
            productName={product.name}
            hasDiscount={!!hasDiscount}
            discountPercent={product.discountPercent}
            config={{
                layout: config.gallery?.layout,
                enableZoom: config.gallery?.enableZoom,
                zoomType: config.gallery?.zoomType,
                enableLightbox: config.gallery?.enableLightbox,
            }}
        />
    );

    // ============================================
    // Product Info
    // ============================================
    const renderProductInfo = () => (
        <div className={styles.productInfo}>
            {/* Breadcrumbs */}
            <nav className={styles.breadcrumbs}>
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                        {index > 0 && <span className={styles.separator}>/</span>}
                        {crumb.href ? (
                            <Link href={crumb.href}>{crumb.label}</Link>
                        ) : (
                            <span>{crumb.label}</span>
                        )}
                    </React.Fragment>
                ))}
            </nav>

            {/* Title & Brand */}
            {config.info?.showBrand && product.brand && (
                <p className={styles.brand}>
                    {typeof product.brand === 'object' ? product.brand.name : product.brand}
                </p>
            )}
            <h1 className={styles.title}>{product.name}</h1>

            {/* Rating Summary */}
            {reviewStats && reviewStats.totalReviews > 0 && (
                <div className={styles.ratingRow}>
                    <div className={styles.stars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={star <= Math.round(reviewStats.averageRating) ? styles.filled : styles.empty}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    <span className={styles.ratingText}>
                        {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews} reviews)
                    </span>
                </div>
            )}

            {/* Price */}
            <div className={styles.pricing}>
                <span className={styles.price}>{formatPrice(effectivePrice, currency)}</span>
                {hasDiscount && displayComparePrice && (
                    <>
                        <span className={styles.comparePrice}>{formatPrice(displayComparePrice, currency)}</span>
                        <span className={styles.discount}>
                            -{Math.round(((displayComparePrice - effectivePrice) / displayComparePrice) * 100)}%
                        </span>
                    </>
                )}
                {showTaxIncluded && currentPricing && (
                    <span className={styles.taxInfo}>incl. tax</span>
                )}
            </div>

            {/* Show price without tax if configured */}
            {showPriceWithoutTax && currentPricing && showTaxIncluded && (
                <p className={styles.priceExTax}>
                    {formatPrice((displayVariant?.pricing?.price || product.pricing?.price || currentPrice), currency)} excl. tax
                </p>
            )}

            {/* Tax breakdown for split taxes */}
            {showTaxIncluded && currentPricing?.taxBreakdown && currentPricing.taxBreakdown.length > 0 && (
                <div className={styles.taxBreakdown}>
                    {currentPricing.taxBreakdown.map((tax, idx) => (
                        <span key={idx} className={styles.taxItem}>
                            {tax.name}: {formatPrice(tax.amount, currency)}
                        </span>
                    ))}
                </div>
            )}

            {/* SKU */}
            {config.info?.showSku && (
                <p className={styles.sku}>
                    SKU: {selectedVariant?.sku || product.sku}
                </p>
            )}

            {/* Short Description */}
            {config.info?.showShortDescription && product.shortDescription && (
                <p className={styles.shortDescription}>{product.shortDescription}</p>
            )}

            {/* Variant Selectors */}
            {product.productOptions && product.productOptions.length > 0 && (
                <ProductVariantSelector
                    options={product.productOptions}
                    selectedOptions={selectedOptions}
                    availableOptions={availableOptions}
                    onOptionChange={onOptionChange}
                    config={{
                        style: config.variants?.style,
                        showUnavailable: config.variants?.showUnavailable,
                    }}
                />
            )}

            {/* Quantity Selector */}
            <div className={styles.quantityRow}>
                <label className={styles.quantityLabel}>Quantity</label>
                <div className={styles.quantitySelector}>
                    <button
                        className={styles.quantityBtn}
                        onClick={() => onQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                    >
                        −
                    </button>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
                        min={1}
                        max={maxQuantity}
                        className={styles.quantityInput}
                    />
                    <button
                        className={styles.quantityBtn}
                        onClick={() => onQuantityChange(quantity + 1)}
                        disabled={hasLimitedStock && quantity >= effectiveStock}
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Stock Status */}
            {config.info?.showStock && (
                <div className={`${styles.stockStatus} ${effectiveStatus === 'low_stock' ? styles.lowStock : (canOrder ? styles.inStock : styles.outOfStock)}`}>
                    <span className={styles.stockDot} />
                    {stockLabel}
                    {showStockCount && ` (${effectiveStock} available)`}
                </div>
            )}

            {/* Action Buttons */}
            {product.type === 'variable' && !allOptionsSelected && (
                <p className={styles.selectOptionsHint}>Please select all options to continue</p>
            )}
            <div className={styles.actions}>
                <button
                    className={styles.addToCartBtn}
                    onClick={onAddToCart}
                    disabled={!canOrder || isAddingToCart || (product.type === 'variable' && !allOptionsSelected)}
                    data-track="add_to_cart"
                    data-item-id={product._id}
                    data-item-name={product.name}
                    data-price={effectivePrice}
                    data-currency={typeof currency === 'object' ? currency.code : currency}
                    data-quantity={quantity}
                >
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                    className={styles.buyNowBtn}
                    onClick={onBuyNow}
                    disabled={!canOrder || isAddingToCart || (product.type === 'variable' && !allOptionsSelected)}
                    data-track="begin_checkout"
                    data-item-id={product._id}
                    data-item-name={product.name}
                    data-price={effectivePrice}
                    data-currency={typeof currency === 'object' ? currency.code : currency}
                    data-quantity={quantity}
                >
                    Buy Now
                </button>
            </div>

            {/* Secondary Actions */}
            <div className={styles.secondaryActions}>
                <button
                    className={`${styles.iconBtn}`}
                    onClick={onAddToWishlist}
                    data-track="add_to_wishlist"
                    data-item-id={product._id}
                    data-item-name={product.name}
                    data-price={effectivePrice}
                >
                    <svg viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
                {compareEnabled && (
                    <button
                        className={`${styles.iconBtn} ${isInCompare ? styles.inCompare : ''} ${compareDisabled ? styles.disabled : ''}`}
                        onClick={onAddToCompare}
                        disabled={compareDisabled}
                        title={compareDisabled ? compareDisabledReason : (isInCompare ? 'Remove from Compare' : 'Add to Compare')}
                    >
                        <svg viewBox="0 0 24 24" fill={isInCompare ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                        </svg>
                        {isInCompare ? 'In Compare' : 'Compare'}
                    </button>
                )}
            </div>

            {/* Social Share */}
            {config.info?.showSocialShare && (
                <ProductSocialShare
                    productName={product.name}
                    productImage={product.images[0]}
                />
            )}


            {config.shipping?.showCalculator && (
                <ShippingCalculator
                    productId={product._id}
                    variantId={selectedVariant?._id}
                    quantity={quantity}
                    userDefaultCountry={userDefaultCountry}
                    onCalculate={onCalculateShipping}
                    estimate={shippingEstimate}
                />
            )}
        </div >
    );

    // ============================================
    // Description Tab
    // ============================================
    const renderDescription = () => (
        <div className={styles.descriptionSection}>
            <div
                className={styles.description}
                dangerouslySetInnerHTML={{ __html: product.description }}
            />
        </div>
    );

    // ============================================
    // Specifications Tab
    // ============================================
    // ============================================
    // Specifications Tab
    // ============================================
    const renderSpecifications = () => {
        if (!config.specifications?.show || !product.specifications || product.specifications.length === 0) {
            return null;
        }

        return (
            <div className={styles.specificationsSection}>
                <table className={styles.specTable}>
                    <tbody>
                        {product.specifications.map((spec, index) => (
                            <tr key={index}>
                                {/* Assuming spec object shape needs validation or casting if using strict models */}
                                <th>{spec.attributeId ? 'Attribute' : spec.name}</th>
                                <td>{String(spec.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };



    // ============================================
    // Reviews Section
    // ============================================
    const renderReviews = () => {
        if (!reviewSettings.allowReviews) return null;

        return (
            <div className={styles.reviewsSection}>
                <h2 className={styles.sectionTitle}>Customer Reviews</h2>

                {/* Rating Breakdown */}
                {reviewStats && (
                    <div className={styles.ratingBreakdown}>
                        <div className={styles.overallRating}>
                            <span className={styles.ratingNumber}>{reviewStats.averageRating.toFixed(1)}</span>
                            <div className={styles.stars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={star <= Math.round(reviewStats.averageRating) ? styles.filled : styles.empty}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className={styles.totalReviews}>
                                Based on {reviewStats.totalReviews} reviews
                            </span>
                        </div>
                        <div className={styles.ratingBars}>
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution];
                                const percent = reviewStats.totalReviews > 0
                                    ? (count / reviewStats.totalReviews) * 100
                                    : 0;
                                return (
                                    <div key={rating} className={styles.ratingBar}>
                                        <span className={styles.ratingLabel}>{rating} star</span>
                                        <div className={styles.barTrack}>
                                            <div
                                                className={styles.barFill}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <span className={styles.ratingCount}>{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Write Review Button */}
                {(isLoggedIn || reviewSettings.allowGuestReviews) && (
                    <button
                        className={styles.writeReviewBtn}
                        onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                        {showReviewForm ? 'Cancel' : 'Write a Review'}
                    </button>
                )}

                {/* Review Form */}
                {showReviewForm && (
                    <form
                        className={styles.reviewForm}
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const success = await onSubmitReview(reviewFormData);
                            if (success) {
                                setShowReviewForm(false);
                                setShowReviewForm(false);
                                setReviewFormData({ rating: 5, title: '', content: '', guestName: '', guestEmail: '', images: [] });
                            }
                        }}
                    >
                        {/* Guest Info */}
                        {!isLoggedIn && reviewSettings.allowGuestReviews && (
                            <div className={styles.guestInfo}>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={reviewFormData.guestName}
                                    onChange={(e) => setReviewFormData(prev => ({ ...prev, guestName: e.target.value }))}
                                    required
                                    className={styles.input}
                                />
                                <input
                                    type="email"
                                    placeholder="Your Email"
                                    value={reviewFormData.guestEmail}
                                    onChange={(e) => setReviewFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                                    required
                                    className={styles.input}
                                />
                            </div>
                        )}

                        {/* Rating */}
                        <div className={styles.ratingInput}>
                            <label>Rating</label>
                            <div className={styles.starInput}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={star <= reviewFormData.rating ? styles.filled : styles.empty}
                                        onClick={() => setReviewFormData(prev => ({ ...prev, rating: star }))}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title & Content */}
                        <input
                            type="text"
                            placeholder="Review Title"
                            value={reviewFormData.title}
                            onChange={(e) => setReviewFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                            className={styles.input}
                        />
                        <textarea
                            placeholder="Write your review..."
                            value={reviewFormData.content}
                            onChange={(e) => setReviewFormData(prev => ({ ...prev, content: e.target.value }))}
                            required
                            rows={5}
                            className={styles.textarea}
                        />

                        {/* Image Upload */}
                        {reviewSettings.allowImages && (
                            <div className={styles.imageUploadSection}>
                                <div className={styles.uploadHeader}>
                                    <label className={styles.uploadBtn}>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading || (reviewSettings.maxImagesPerReview ? reviewFormData.images.length >= reviewSettings.maxImagesPerReview : false)}
                                            style={{ display: 'none' }}
                                        />
                                        <span className={styles.uploadIcon}>📷</span>
                                        {uploading ? 'Uploading...' : 'Add Photos'}
                                    </label>
                                    <span className={styles.uploadLimit}>
                                        {reviewFormData.images.length} / {reviewSettings.maxImagesPerReview || 3}
                                    </span>
                                </div>

                                {reviewFormData.images.length > 0 && (
                                    <div className={styles.imagePreviews}>
                                        {reviewFormData.images.map((url, idx) => (
                                            <div key={idx} className={styles.previewItem}>
                                                <Image src={url} alt="Review" width={60} height={60} className={styles.previewInfo} />
                                                <button
                                                    type="button"
                                                    className={styles.removeImageBtn}
                                                    onClick={() => handleRemoveImage(idx)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={styles.submitReviewBtn}
                            disabled={isSubmittingReview}
                        >
                            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                )}

                {/* Reviews List */}
                <div className={styles.reviewsList}>
                    {reviewsLoading && reviews.length === 0 ? (
                        <div className={styles.loading}>Loading reviews...</div>
                    ) : reviews.length === 0 ? (
                        <div className={styles.noReviews}>
                            No reviews yet. Be the first to review this product!
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review._id} className={styles.reviewItem}>
                                <div className={styles.reviewHeader}>
                                    <div className={styles.reviewerInfo}>
                                        <span className={styles.reviewerName}>
                                            {review.isGuestReview
                                                ? review.guestName
                                                : `${review.customerId?.firstName || ''} ${review.customerId?.lastName || ''}`}
                                        </span>
                                        {review.isVerifiedPurchase && (
                                            <span className={styles.verifiedBadge}>Verified Purchase</span>
                                        )}
                                    </div>
                                    <div className={styles.reviewStars}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={star <= review.rating ? styles.filled : styles.empty}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <h4 className={styles.reviewTitle}>{review.title}</h4>
                                <p className={styles.reviewContent}>{review.content}</p>
                                {review.images && review.images.length > 0 && (

                                    <div className={styles.reviewImages}>
                                        {review.images.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className={styles.reviewImageWrapper}
                                                onClick={() => setLightboxImage(img)}
                                            >
                                                <Image src={img} alt="" width={80} height={80} className={styles.reviewImage} />
                                            </div>
                                        ))}

                                    </div>
                                )}
                                <div className={styles.reviewMeta}>
                                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>

                                    <div className={styles.helpfulAction}>
                                        <button
                                            className={`${styles.helpfulBtn} ${userId && review.votedBy?.includes(userId) ? styles.active : ''}`}
                                            onClick={() => isLoggedIn && onHelpfulVote(review._id)}
                                            disabled={!isLoggedIn}
                                        >
                                            Helpful ({review.helpfulCount || 0})
                                        </button>
                                        {!isLoggedIn && (
                                            <span className={styles.tooltip}>Please log in to mark as helpful</span>
                                        )}
                                    </div>
                                </div>

                                {
                                    review.adminReply && (
                                        <div className={styles.adminReply}>
                                            <strong>Store Response:</strong>
                                            <p>{review.adminReply.content}</p>
                                        </div>
                                    )
                                }
                            </div>
                        ))
                    )}
                </div>

                {/* Load More */}
                {
                    reviewsPagination.page < reviewsPagination.pages && (
                        <button
                            className={styles.loadMoreBtn}
                            onClick={onLoadMoreReviews}
                            disabled={reviewsLoading}
                        >
                            {reviewsLoading ? 'Loading...' : 'Load More Reviews'}
                        </button>
                    )
                }
            </div >
        );
    };

    // ============================================
    // Tabs Section
    // ============================================
    const renderTabs = () => {
        // Build tabs array based on config
        const tabs = [
            {
                id: 'description',
                label: 'Description',
                content: renderDescription(),
                show: config.tabs?.showDescription !== false,
            },
            {
                id: 'specifications',
                label: 'Specifications',
                content: renderSpecifications(),
                show: config.tabs?.showSpecifications !== false &&
                    config.specifications?.show !== false &&
                    product.specifications &&
                    product.specifications.length > 0,
            },
            {
                id: 'videos',
                label: `Videos (${product.videos?.length || 0})`,
                content: (
                    <ProductVideoGallery
                        videos={product.videos || []}
                        productName={product.name}
                    />
                ),
                show: config.gallery?.showVideoGallery !== false &&
                    product.videos &&
                    product.videos.length > 0,
            },
            {
                id: 'reviews',
                label: `Reviews (${reviewStats?.totalReviews || 0})`,
                content: renderReviews(),
                show: config.tabs?.showReviews !== false &&
                    config.info?.showReviews !== false &&
                    reviewSettings.allowReviews,
            },
        ];

        return (
            <ProductTabs
                tabs={tabs}
                config={{
                    layout: config.tabs?.layout,
                }}
            />
        );
    };

    // ============================================
    // Main Render
    // ============================================

    // If layout exists, render sections using SectionRenderer
    if (layout?.sections && layout.sections.length > 0) {
        return (
            <>
                <div className={styles.productPage}>
                    {layout.sections.map((section: any) => (
                        <SectionRenderer
                            key={section.id}
                            section={section}
                            renderModule={(module) => renderModule(module)}
                        />
                    ))}
                </div>
                {renderLightbox()}
            </>
        );
    }

    // Default layout (no custom layout)
    return (
        <div className={styles.productPage}>
            <div className={styles.container}>
                {/* Main Product Section */}
                <div className={styles.mainSection}>
                    {renderGallery()}
                    {renderProductInfo()}
                </div>

                {/* Tabs Section */}
                {renderTabs()}

                {/* Related Products - add via layout builder module */}
            </div>
            {renderLightbox()}
        </div>
    );
}
