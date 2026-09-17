'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/providers/ToastProvider';
import { CartItem as CartItemType } from '@/types/cart';
import { useCurrency } from '@/hooks/useCurrency';
import { useThemeConfig } from '@/providers/StoreProvider';
import styles from './CartItem.module.scss';

interface CartItemProps {
    item: CartItemType & {
        productId: {
            _id: string;
            name: string;
            slug: string;
            images?: string[];
            stockStatus?: string;
            stock?: number;
            manageStock?: boolean;
        };
    };
    onUpdateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
    onRemove: (itemId: string) => Promise<{ success: boolean; error?: string }>;
    compact?: boolean;
}

export default function CartItem({ item, onUpdateQuantity, onRemove, compact = false }: CartItemProps) {
    const { formatPriceWithExchange } = useCurrency();
    const themeConfig = useThemeConfig();
    const toast = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [pricePulsing, setPricePulsing] = useState(false);

    const product = item.productId;
    const productImage = item.image || product.images?.[0] || '/placeholder-product.png';
    const productUrl = `/${product.slug}`;

    // Calculate available stock
    const availableStock = product.manageStock ? (product.stock || 0) : 999;
    const isOutOfStock = product.manageStock && availableStock <= 0;
    const isLowStock = product.manageStock && availableStock > 0 && availableStock <= 5;

    // Handle quantity change
    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity < 1) return;
        if (product.manageStock && newQuantity > availableStock) {
            toast.error(`Only ${availableStock} items available in stock`);
            return;
        }

        setIsUpdating(true);
        try {
            const result = await onUpdateQuantity(item._id, newQuantity);
            if (!result.success) {
                toast.error(result.error || 'Failed to update quantity');
            } else {
                toast.success('Quantity updated');
                setPricePulsing(true);
                setTimeout(() => setPricePulsing(false), 500);
            }
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle remove
    const handleRemove = async () => {
        setIsRemoving(true);
        try {
            const result = await onRemove(item._id);
            if (!result.success) {
                toast.error(result.error || 'Failed to remove item');
                setIsRemoving(false);
            } else {
                toast.success('Item removed from cart');
            }
        } catch {
            setIsRemoving(false);
        }
    };

    // Calculate price to display
    const showTaxIncluded = themeConfig?.product?.pricing?.showTaxIncluded;
    const priceToDisplay = (showTaxIncluded && item.priceWithTax) ? item.priceWithTax : item.price;
    const itemTotal = priceToDisplay * item.quantity;

    return (
        <div className={`${styles.cartItem} ${compact ? styles.compact : ''} ${isRemoving ? styles.removing : ''}`}>
            {/* Product Image */}
            <Link href={productUrl} className={styles.imageWrapper} tabIndex={-1}>
                <Image
                    src={productImage}
                    alt={item.name}
                    width={compact ? 64 : 88}
                    height={compact ? 64 : 88}
                    className={styles.image}
                />
            </Link>

            {/* Product Details & Content */}
            <div className={styles.content}>
                <div className={styles.headerRow}>
                    <div className={styles.titleArea}>
                        <Link href={productUrl} className={styles.name} title={item.name}>
                            {item.name}
                        </Link>
                        {item.sku && <span className={styles.skuTag}>SKU: {item.sku}</span>}
                    </div>

                    {/* Remove Action Button on top-right */}
                    <button
                        onClick={handleRemove}
                        disabled={isRemoving || isUpdating}
                        className={styles.removeBtn}
                        aria-label="Remove item"
                        title="Remove item"
                    >
                        {isRemoving ? (
                            <span className={styles.loaderIcon} />
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Variant Attributes & Stock */}
                {((item.attributes && Object.keys(item.attributes).length > 0) || isOutOfStock || isLowStock) && (
                    <div className={styles.metaRow}>
                        {item.attributes && Object.entries(item.attributes).map(([key, value]) => (
                            <span key={key} className={styles.attribute}>
                                <strong className={styles.attrKey}>{key}:</strong> {value}
                            </span>
                        ))}

                        {isOutOfStock && (
                            <span className={`${styles.stockBadge} ${styles.outOfStock}`}>Out of Stock</span>
                        )}
                        {isLowStock && (
                            <span className={`${styles.stockBadge} ${styles.lowStock}`}>Only {availableStock} left</span>
                        )}
                    </div>
                )}

                {/* Bottom Row: Quantity on left, Pricing on right */}
                <div className={styles.footerRow}>
                    <div className={styles.quantitySection}>
                        <div className={styles.quantityControls}>
                            <button
                                type="button"
                                onClick={() => handleQuantityChange(item.quantity - 1)}
                                disabled={isUpdating || isRemoving || item.quantity <= 1}
                                className={styles.quantityBtn}
                                aria-label="Decrease quantity"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) handleQuantityChange(val);
                                }}
                                disabled={isUpdating || isRemoving}
                                className={styles.quantityInput}
                                min="1"
                                max={product.manageStock ? availableStock : undefined}
                                aria-label="Quantity"
                            />
                            <button
                                type="button"
                                onClick={() => handleQuantityChange(item.quantity + 1)}
                                disabled={isUpdating || isRemoving || (product.manageStock && item.quantity >= availableStock)}
                                className={styles.quantityBtn}
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>
                        {isUpdating && <span className={styles.updatingText}>Updating...</span>}
                    </div>

                    <div className={styles.pricingSection}>
                        <div className={`${styles.totalPrice} ${pricePulsing ? styles.pulse : ''}`}>
                            {formatPriceWithExchange(itemTotal)}
                        </div>
                        {(item.quantity > 1 || !compact) && (
                            <div className={styles.unitPrice}>
                                {item.quantity > 1 ? (
                                    <>
                                        <span>{formatPriceWithExchange(priceToDisplay)}</span> each
                                    </>
                                ) : (
                                    <span>{formatPriceWithExchange(priceToDisplay)}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
