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
            <Link href={productUrl} className={styles.imageWrapper}>
                <Image
                    src={productImage}
                    alt={item.name}
                    width={compact ? 60 : 100}
                    height={compact ? 60 : 100}
                    className={styles.image}
                />
            </Link>

            {/* Product Details */}
            <div className={styles.details}>
                <div className={styles.nameRow}>
                    <Link href={productUrl} className={styles.name}>
                        {item.name}
                    </Link>
                    {item.sku && <span className={styles.skuTag}>{item.sku}</span>}
                </div>

                {/* Variant Attributes */}
                {item.attributes && Object.keys(item.attributes).length > 0 && (
                    <div className={styles.attributes}>
                        {Object.entries(item.attributes).map(([key, value]) => (
                            <span key={key} className={styles.attribute}>
                                {key}: {value}
                            </span>
                        ))}
                    </div>
                )}

                {/* Stock Status */}
                {isOutOfStock && (
                    <div className={styles.stockWarning}>Out of Stock</div>
                )}
                {isLowStock && (
                    <div className={styles.stockWarning}>Only {availableStock} left in stock</div>
                )}
            </div>

            {/* Price (Desktop) */}
            {!compact && (
                <div className={styles.price}>
                    <span className={styles.metaLabel}>Price</span>
                    {formatPriceWithExchange(priceToDisplay)}
                </div>
            )}

            {/* Quantity Controls */}
            <div className={styles.quantityWrapper}>
                <span className={styles.metaLabel}>Qty</span>
                <div className={styles.quantityControls}>
                    <button
                        onClick={() => handleQuantityChange(item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
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
                        disabled={isUpdating}
                        className={styles.quantityInput}
                        min="1"
                        max={product.manageStock ? availableStock : undefined}
                    />
                    <button
                        onClick={() => handleQuantityChange(item.quantity + 1)}
                        disabled={isUpdating || (product.manageStock && item.quantity >= availableStock)}
                        className={styles.quantityBtn}
                        aria-label="Increase quantity"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Total (Desktop) */}
            {!compact && (
                <div className={styles.total}>
                    <span className={styles.metaLabel}>Total</span>
                    {formatPriceWithExchange(itemTotal)}
                </div>
            )}

            {/* Price (Mobile / Compact) */}
            <div className={styles.priceMobile}>
                <span>{formatPriceWithExchange(itemTotal)}</span>
                {item.quantity > 1 && (
                    <small>{formatPriceWithExchange(priceToDisplay)} each</small>
                )}
            </div>

            {/* Remove Button */}
            <button
                onClick={handleRemove}
                disabled={isRemoving}
                className={styles.removeBtn}
                aria-label="Remove item"
            >
                {isRemoving ? '...' : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 6L6 18M6 6l12 12" />
                    </svg>
                )}
            </button>
        </div>
    );
}
