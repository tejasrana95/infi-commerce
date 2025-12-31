'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Modal from '@/components/atoms/Modal';
import { ProductVariantSelector } from '@/components/molecules/ProductVariantSelector';
import { useStore, useThemeConfig } from '@/providers/StoreProvider';
import { useCart } from '@/providers/CartProvider';
import { useWishlist } from '@/providers/WishlistProvider';
import { useToast } from '@/providers/ToastProvider';
import { formatPrice } from '@/lib/currency';
import api from '@/lib/api';
import styles from './QuickViewModal.module.scss';

interface ProductPricing {
    price: number;
    salePrice?: number;
    priceWithTax: number;
    salePriceWithTax?: number;
    taxRate: number;
    taxAmount: number;
    finalPrice: number;
}

interface ProductVariant {
    _id: string;
    sku?: string;
    price: number;
    salePrice?: number;
    stock: number;
    images?: string[];
    attributes: Record<string, string>;
    pricing?: ProductPricing;
}

interface ProductOption {
    _id: string;
    optionId: string;
    name: string;
    displayName: string;
    type: 'dropdown' | 'color' | 'button' | 'image';
    isVariation: boolean;
    values: Array<{
        value: string;
        label: string;
        colorHex?: string;
        image?: string;
    }>;
}

interface Product {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    images?: string[];
    type?: 'simple' | 'variable';
    productOptions?: ProductOption[];
    variants?: ProductVariant[];
    rating?: number;
    reviewCount?: number;
    shortDescription?: string;
    inStock?: boolean;
    stock?: number;
    stockStatus?: string;
    manageStock?: boolean;
    lowStockThreshold?: number;
    pricing?: ProductPricing;
    brand?: { name: string } | string;
}

interface QuickViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    currency: import('@/types').Currency | string;
}

export default function QuickViewModal({
    isOpen,
    onClose,
    product,
    currency,
}: QuickViewModalProps) {
    const router = useRouter();
    const { store } = useStore();
    const themeConfig = useThemeConfig();
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { success, error: toastError } = useToast();

    // State
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [fullProduct, setFullProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch full product data when modal opens
    useEffect(() => {
        if (isOpen && product.slug && store?._id) {
            setIsLoading(true);
            setSelectedOptions({});
            setQuantity(1);
            setMainImageIndex(0);

            api.get<{ product: Product }>(`products/slug/${store._id}/${product.slug}`)
                .then(response => {
                    setFullProduct(response.product);
                })
                .catch(error => {
                    console.error('Error fetching product details:', error);
                    // Fallback to basic product data
                    setFullProduct(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else if (!isOpen) {
            // Reset when modal closes
            setFullProduct(null);
            setSelectedOptions({});
            setQuantity(1);
            setMainImageIndex(0);
        }
    }, [isOpen, product.slug, store?._id]);

    // Use full product data if available, otherwise fallback to basic product
    const displayProduct = fullProduct || product;

    // Find matching variant based on selected options
    const findMatchingVariant = useCallback((): ProductVariant | undefined => {
        if (!displayProduct.variants || displayProduct.variants.length === 0) return undefined;
        if (Object.keys(selectedOptions).length === 0) return undefined;

        return displayProduct.variants.find(variant => {
            return Object.entries(selectedOptions).every(([key, value]) => {
                return variant.attributes[key] === value;
            });
        });
    }, [displayProduct.variants, selectedOptions]);

    const selectedVariant = findMatchingVariant();

    // Get only variation options (not all product options)
    const variationOptions = (displayProduct.productOptions || []).filter(opt => opt.isVariation);

    // Check if all variation options are selected (for variable products)
    const allOptionsSelected = displayProduct.type === 'variable'
        ? variationOptions.length > 0 &&
        variationOptions.every(opt => selectedOptions[opt.optionId])
        : true;

    // Current images (variant images or product images)
    const currentImages = selectedVariant?.images?.length
        ? selectedVariant.images
        : (displayProduct.images || []);

    // Tax config from theme settings
    const showTaxIncluded = themeConfig?.product?.pricing?.showTaxIncluded ?? false;

    // Get current pricing (prefer variant pricing if available) - matches ProductPage logic
    const currentPricing = selectedVariant?.pricing || displayProduct.pricing;
    const currentPrice = selectedVariant?.price ?? displayProduct.price;
    const currentSalePrice = selectedVariant?.salePrice ?? displayProduct.salePrice;

    // Determine display prices based on tax settings - matches ProductPage
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

    // Calculate effective price (sale price takes priority if it's lower)
    const effectivePrice = displaySalePrice && displaySalePrice < displayPrice
        ? displaySalePrice
        : displayPrice;
    const originalPrice = displayComparePrice || displayPrice;
    const hasDiscount = displaySalePrice && displaySalePrice < displayPrice;
    const discountPercent = hasDiscount
        ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
        : undefined;

    // Stock status - matches ProductPage logic
    const effectiveStock = selectedVariant?.stock ?? displayProduct.stock ?? 999;

    // Determine effective status (same logic as ProductPage)
    let effectiveStatus: string = displayProduct.stockStatus || 'in_stock';
    if (displayProduct.manageStock) {
        if (effectiveStock <= 0) {
            effectiveStatus = ['on_backorder', 'pre_order'].includes(displayProduct.stockStatus || '')
                ? displayProduct.stockStatus!
                : 'out_of_stock';
        } else {
            // Stock > 0
            const statusToFlip = ['out_of_stock', 'on_backorder', 'in_stock', 'low_stock'];
            if (statusToFlip.includes(displayProduct.stockStatus || '')) {
                if (displayProduct.lowStockThreshold && effectiveStock <= displayProduct.lowStockThreshold) {
                    effectiveStatus = 'low_stock';
                } else {
                    effectiveStatus = 'in_stock';
                }
            }
        }
    }

    // Determine if product can be ordered
    const canOrder = effectiveStatus !== 'out_of_stock' &&
        (displayProduct.type !== 'variable' || allOptionsSelected);

    // Check if stock is limited (for quantity selector)
    const hasLimitedStock = displayProduct.manageStock && ['in_stock', 'low_stock'].includes(effectiveStatus || '');
    const maxQuantity = hasLimitedStock ? effectiveStock : 999;

    // Stock status labels
    const stockStatusLabels: Record<string, string> = {
        'in_stock': 'In Stock',
        'out_of_stock': 'Out of Stock',
        'low_stock': 'Low Stock',
        'pre_order': 'Pre Order',
        'on_backorder': 'On Backorder',
        'made_to_order': 'Made to Order',
    };
    const stockLabel = stockStatusLabels[effectiveStatus || ''] || 'In Stock';
    const showStockCount = displayProduct.manageStock &&
        ['in_stock', 'low_stock'].includes(effectiveStatus || '') &&
        effectiveStock > 0;

    // Get brand name
    const brandName = typeof displayProduct.brand === 'object' ? displayProduct.brand?.name : displayProduct.brand;

    // Handle option change
    const handleOptionChange = (optionName: string, value: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            [optionName]: value,
        }));
    };

    // Build available options (for showing which options are available)
    // Uses optionId as key to match variant.attributes structure
    const getAvailableOptions = (): Record<string, string[]> => {
        const variationOptions = (displayProduct.productOptions || []).filter(opt => opt.isVariation);

        if (variationOptions.length === 0) return {};

        // If no variants, all option values are available
        if (!displayProduct.variants || displayProduct.variants.length === 0) {
            const available: Record<string, string[]> = {};
            variationOptions.forEach(opt => {
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
            const matchingVariants = displayProduct.variants!.filter(variant => {
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
    };

    // Handle add to cart
    const handleAddToCart = async () => {
        if (displayProduct.type === 'variable' && !allOptionsSelected) {
            toastError('Please select all options');
            return;
        }

        setIsAddingToCart(true);
        try {
            const result = await addToCart({
                productId: product._id,
                variantId: selectedVariant?._id,
                quantity,
                storeId: store?._id || '',
            });

            if (result.success) {
                success(`${displayProduct.name} added to cart`);
                onClose();
            } else {
                toastError(result.error || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toastError('An error occurred');
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Handle buy now
    const handleBuyNow = async () => {
        if (displayProduct.type === 'variable' && !allOptionsSelected) {
            toastError('Please select all options');
            return;
        }

        setIsAddingToCart(true);
        try {
            const result = await addToCart({
                productId: product._id,
                variantId: selectedVariant?._id,
                quantity,
                storeId: store?._id || '',
            });

            if (result.success) {
                onClose();
                router.push('/checkout');
            } else {
                toastError(result.error || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Error during buy now:', error);
            toastError('An error occurred');
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Render stars
    const renderStars = () => {
        if (!displayProduct.rating) return null;

        const fullStars = Math.floor(displayProduct.rating);
        return (
            <div className={styles.rating}>
                <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <span
                            key={star}
                            className={star <= fullStars ? styles.filled : styles.empty}
                        >
                            ★
                        </span>
                    ))}
                </div>
                {displayProduct.reviewCount !== undefined && displayProduct.reviewCount > 0 && (
                    <span className={styles.reviewCount}>({displayProduct.reviewCount})</span>
                )}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="large"
            showCloseButton={true}
        >
            {isLoading ? (
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner} />
                    <p>Loading product details...</p>
                </div>
            ) : (
                <div className={styles.quickView}>
                    {/* Gallery Section */}
                    <div className={styles.gallery}>
                        <div className={styles.mainImage}>
                            {currentImages[mainImageIndex] ? (
                                <img
                                    src={currentImages[mainImageIndex]}
                                    alt={displayProduct.name}
                                />
                            ) : (
                                <div className={styles.placeholder}>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                            {/* Discount badge */}
                            {hasDiscount && discountPercent && (
                                <span className={styles.discountBadge}>-{discountPercent}%</span>
                            )}
                        </div>
                        {currentImages.length > 1 && (
                            <div className={styles.thumbnails}>
                                {currentImages.slice(0, 5).map((img, index) => (
                                    <button
                                        key={index}
                                        className={`${styles.thumbnail} ${index === mainImageIndex ? styles.active : ''}`}
                                        onClick={() => setMainImageIndex(index)}
                                    >
                                        <img src={img} alt={`${displayProduct.name} ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className={styles.details}>
                        {/* Brand */}
                        {brandName && <p className={styles.brand}>{brandName}</p>}

                        {/* Title */}
                        <h2 className={styles.title}>{displayProduct.name}</h2>

                        {/* Rating */}
                        {renderStars()}

                        {/* Pricing */}
                        <div className={styles.pricing}>
                            <span className={styles.price}>
                                {formatPrice(effectivePrice, currency)}
                            </span>
                            {hasDiscount && (
                                <span className={styles.comparePrice}>
                                    {formatPrice(originalPrice, currency)}
                                </span>
                            )}
                        </div>

                        {/* Short description */}
                        {displayProduct.shortDescription && (
                            <p className={styles.shortDescription}>{displayProduct.shortDescription}</p>
                        )}

                        {/* Variant Selectors */}
                        {displayProduct.productOptions && displayProduct.productOptions.length > 0 && (
                            <div className={styles.variants}>
                                <ProductVariantSelector
                                    options={displayProduct.productOptions}
                                    selectedOptions={selectedOptions}
                                    availableOptions={getAvailableOptions()}
                                    onOptionChange={handleOptionChange}
                                    config={{ style: 'buttons', showUnavailable: true }}
                                />
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div className={styles.quantityRow}>
                            <label className={styles.quantityLabel}>Quantity</label>
                            <div className={styles.quantitySelector}>
                                <button
                                    className={styles.quantityBtn}
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
                                    min={1}
                                    max={maxQuantity}
                                    className={styles.quantityInput}
                                />
                                <button
                                    className={styles.quantityBtn}
                                    onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                                    disabled={quantity >= maxQuantity}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Stock status */}
                        <div className={`${styles.stockStatus} ${effectiveStatus === 'low_stock' ? styles.lowStock : (canOrder ? styles.inStock : styles.outOfStock)}`}>
                            <span className={styles.dot} />
                            {stockLabel}
                            {showStockCount && ` (${effectiveStock} available)`}
                        </div>

                        {/* Variable product hint */}
                        {displayProduct.type === 'variable' && !allOptionsSelected && (
                            <p className={styles.optionsHint}>Please select all options to continue</p>
                        )}

                        {/* Action Buttons */}
                        <div className={styles.actions}>
                            <button
                                className={styles.addToCartBtn}
                                onClick={handleAddToCart}
                                disabled={!canOrder || isAddingToCart}
                            >
                                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                            </button>
                            <button
                                className={styles.buyNowBtn}
                                onClick={handleBuyNow}
                                disabled={!canOrder || isAddingToCart}
                            >
                                Buy Now
                            </button>
                        </div>

                        {/* Secondary Actions */}
                        <div className={styles.secondaryActions}>
                            <button
                                className={`${styles.wishlistBtn} ${isInWishlist(product._id) ? styles.wishlisted : ''}`}
                                onClick={() => toggleWishlist(product._id)}
                            >
                                <svg viewBox="0 0 24 24" fill={isInWishlist(product._id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {isInWishlist(product._id) ? 'In Wishlist' : 'Add to Wishlist'}
                            </button>
                        </div>

                        {/* View Full Details Link */}
                        <Link href={`/product/${product.slug}`} className={styles.viewDetailsLink} onClick={onClose}>
                            View Full Details →
                        </Link>
                    </div>
                </div>
            )}
        </Modal>
    );
}
