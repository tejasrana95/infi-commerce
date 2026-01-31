'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/atoms/Modal';
import styles from './ReturnOrderModal.module.scss';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/services/api-client';
import { useStore } from '@/providers/StoreProvider';
import { useCurrency } from '@/hooks/useCurrency';

interface ReturnOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any; // Using any for now to match flexible order structure, but should ideally be typed
    onSuccess?: () => void;
}

interface EligibilityResult {
    eligible: boolean;
    reason?: string;
}

const RETURN_REASONS = [
    { value: 'defective', label: 'Defective or Damaged' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'not_as_described', label: 'Product Not As Described' },
    { value: 'size_fit', label: 'Size or Fit Issue' },
    { value: 'quality', label: 'Quality Issue' },
    { value: 'changed_mind', label: 'Changed my mind' },
    { value: 'other', label: 'Other' },
];



export default function ReturnOrderModal({ isOpen, onClose, order, onSuccess }: ReturnOrderModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { store } = useStore();
    const { returnSettings } = store?.settings || {};
    const { convertAndFormat } = useCurrency();
    // Form state
    const [type, setType] = useState<'return' | 'exchange'>('return');
    const [reason, setReason] = useState('');
    const [refundMethod, setRefundMethod] = useState('original');
    const [customerNotes, setCustomerNotes] = useState('');
    const [selectedItems, setSelectedItems] = useState<Map<string, { quantity: number; checked: boolean }>>(new Map());

    const REFUND_METHODS = [
        { value: 'original', label: 'Refund to Original Payment Method' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
    ];

    if (returnSettings?.refundMethods) {
        REFUND_METHODS.splice(0, REFUND_METHODS.length, ...returnSettings.refundMethods.map(method => {
            if (method === 'original') {
                return { value: 'original', label: 'Refund to Original Payment Method' };
            } else if (method === 'bank_transfer') {
                return { value: 'bank_transfer', label: 'Bank Transfer' };
            }
            return { value: method, label: method };
        }));
    }

    // Initialize selected items when order changes
    useEffect(() => {
        if (order?.items) {
            const initialSelection = new Map<string, { quantity: number; checked: boolean }>();
            order.items.forEach((item: any) => {
                // Determine unique key
                const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
                const maxQty = item.quantity; // In a real app we might subtract already returned qty
                const { eligible } = getEligibility(item, type);
                initialSelection.set(key, { quantity: maxQty, checked: eligible ? true : false });
            });
            setSelectedItems(initialSelection);
        }
    }, [order]);

    const handleItemToggle = (itemKey: string) => {
        setSelectedItems((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(itemKey);
            if (current) {
                newMap.set(itemKey, { ...current, checked: !current.checked });
            }
            return newMap;
        });
    };

    const getEligibility = (item: any, returnType: 'return' | 'exchange'): EligibilityResult => {
        if (!order?.deliveredAt) return { eligible: false, reason: 'Order not delivered' };

        // 1. Master switch check (isReturnable)
        if (item.isReturnable === false) {
            return { eligible: false, reason: 'This item is not returnable' };
        }

        // 2. Window check
        const deliveryDate = new Date(order.deliveredAt);
        const now = new Date();
        const windowDays = returnType === 'return'
            ? (item.returnWindowDays ?? 0)
            : (item.exchangeWindowDays ?? 0);

        // Calculate deadline
        const deadline = new Date(deliveryDate);
        deadline.setDate(deadline.getDate() + windowDays);

        // Check date
        if (now > deadline) {
            return {
                eligible: false,
                reason: `${returnType === 'return' ? 'Return' : 'Exchange'} window closed on ${deadline.toLocaleDateString()}`
            };
        }

        return { eligible: true };
    };

    const handleQuantityChange = (itemKey: string, quantity: number, max: number) => {
        setSelectedItems((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(itemKey);
            if (current) {
                newMap.set(itemKey, { ...current, quantity: Math.min(Math.max(1, quantity), max) });
            }
            return newMap;
        });
    };

    const isFullOrderReturn = () => {
        if (!order?.items || order.items.length === 0) return false;
        let totalItems = 0;
        let selectedCount = 0;
        order.items.forEach((item: any) => {
            totalItems++;
            const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
            const selection = selectedItems.get(key);
            if (selection?.checked) {
                selectedCount++;
            }
        });
        return totalItems > 0 && totalItems === selectedCount;
    };

    const calculateRefundBreakdown = () => {
        if (!order) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };

        let subtotal = 0;
        let tax = 0;
        order.items.forEach((item: any) => {
            const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
            const selection = selectedItems.get(key);
            if (selection?.checked) {
                // Use discounted price if available, otherwise regular price
                const price = item.discountedPrice || item.price || 0;
                subtotal += (price * selection.quantity);
                tax += (item.taxAmount || 0) * selection.quantity;
            }
        });

        // Only include shipping if entire order is being returned
        const shipping = isFullOrderReturn() ? (order.shippingCost || 0) : 0;

        return {
            subtotal,
            tax,
            shipping,
            total: subtotal + tax + shipping
        };
    };

    const getSelectedItemsCount = () => {
        let count = 0;
        selectedItems.forEach((selection) => {
            if (selection.checked) count++;
        });
        return count;
    };

    const handleSubmit = async () => {
        if (!order) return;

        // Check if returns are enabled
        if (!returnSettings?.enabled) {
            setError('Returns and exchanges are currently disabled');
            return;
        }

        // Check if return reason is required by store settings
        const requireReturnReason = returnSettings?.requireReturnReason ?? true;
        if (requireReturnReason && !reason) {
            setError('Please select a return reason');
            return;
        }

        if (getSelectedItemsCount() === 0) {
            setError('Please select at least one item to return');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Build items array
            const items: any[] = [];

            order.items.forEach((item: any) => {
                const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
                const selection = selectedItems.get(key);

                if (selection?.checked) {
                    const price = item.price || 0;
                    const itemSubtotal = price * selection.quantity;
                    const taxAmount = (item.taxAmount || 0) * selection.quantity;
                    const total = itemSubtotal + taxAmount;

                    items.push({
                        productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
                        variantId: item.variantId,
                        quantity: selection.quantity,
                        name: item.name,
                        sku: item.sku,
                        refundAmount: total,
                    });
                }
            });

            const refundBreakdown = calculateRefundBreakdown();
            const payload = {
                orderId: order._id,
                storeId: typeof order.storeId === 'object' ? order.storeId._id : order.storeId,
                customerId: typeof order.customerId === 'object' ? order.customerId._id : (order.customerId || 'guest'),
                type,
                reason,
                items,
                refundMethod,
                customerNotes,
                subtotalRefundAmount: refundBreakdown.subtotal,
                taxRefundAmount: refundBreakdown.tax,
                shippingRefundAmount: refundBreakdown.shipping,
                totalRefundAmount: refundBreakdown.total,
            };

            await apiClient.post('returns/create', payload);
            toast.success('Return request submitted successfully');
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Return request failed:', err);
            setError(err.response?.data?.message || 'Failed to submit return request');
            toast.error(err.response?.data?.message || 'Failed to submit return request');
        } finally {
            setLoading(false);
        }
    };

    // Footer content
    const footer = (
        <div className={styles.footerActions}>
            <button
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={loading}
            >
                Cancel
            </button>
            <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={loading || getSelectedItemsCount() === 0 || !returnSettings?.enabled}
                title={!returnSettings?.enabled ? 'Returns are currently disabled' : (type === 'return' ? 'Request Return' : 'Request Exchange')}
            >
                {loading ? 'Submitting...' : type === 'return' ? 'Request Return' : 'Request Exchange'}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${type === 'return' ? 'Request Return' : 'Request Exchange'} - Order #${order?.orderNumber}`}
            footer={footer}
            size="large"
            closeOnOverlayClick={!loading}
        >
            <div className={styles.container}>
                {error && <div className={styles.errorAlert}>{error}</div>}
                {!returnSettings?.enabled && (
                    <div className={styles.errorAlert}>Returns and exchanges are currently disabled for this store.</div>
                )}

                <div className={styles.section}>
                    <h3>Return Type</h3>
                    <div className={styles.radioGroup}>
                        <label className={`${styles.radioCard} ${type === 'return' ? styles.active : ''}`}>
                            <input
                                type="radio"
                                name="type"
                                value="return"
                                checked={type === 'return'}
                                onChange={() => setType('return')}
                            />
                            <div>
                                <span className={styles.radioTitle}>Return for Refund</span>
                                <span className={styles.radioDesc}>Return items and get your money back</span>
                            </div>
                        </label>
                        <label className={`${styles.radioCard} ${type === 'exchange' ? styles.active : ''}`}>
                            <input
                                type="radio"
                                name="type"
                                value="exchange"
                                checked={type === 'exchange'}
                                onChange={() => setType('exchange')}
                            />
                            <div>
                                <span className={styles.radioTitle}>Exchange</span>
                                <span className={styles.radioDesc}>Exchange for a different size or color</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Select Items</h3>
                    <div className={styles.itemsList}>
                        {order?.items?.map((item: any) => {
                            // Validation logic
                            const { eligible, reason: eligibilityReason } = getEligibility(item, type);
                            const disabled = !eligible;
                            const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
                            const selection = selectedItems.get(key);
                            const isChecked = disabled ? false : selection?.checked || false;
                            const qty = selection?.quantity || 1;
                            const maxQty = item.quantity;

                            return (
                                <div key={key} className={`${styles.itemRow} ${isChecked ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}>
                                    <div className={styles.checkboxCol}>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleItemToggle(key)}
                                            disabled={disabled}
                                            title={disabled ? eligibilityReason : ''}
                                        />
                                    </div>
                                    <div className={styles.imageCol}>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} />
                                        ) : (
                                            <div className={styles.placeholder}>📦</div>
                                        )}
                                    </div>
                                    <div className={styles.infoCol}>
                                        <span className={styles.name}>{item.name}</span>
                                        <span className={styles.sku}>{item.sku}</span>
                                    </div>
                                    <div className={styles.qtyCol}>
                                        {isChecked ? (
                                            <div className={styles.qtyControl}>
                                                <label>Qty:</label>
                                                {returnSettings?.allowPartialReturns ? (
                                                    <select
                                                        value={qty}
                                                        onChange={(e) => handleQuantityChange(key, parseInt(e.target.value), maxQty)}
                                                    >
                                                        {Array.from({ length: maxQty }, (_, i) => i + 1).map(n => (
                                                            <option key={n} value={n}>{n}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={styles.qtyText}>{maxQty}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className={styles.qtyText}>Qty: {maxQty}</span>
                                        )}
                                    </div>
                                    <div className={styles.priceCol}>
                                        {convertAndFormat((item.discountedPrice || item.price) * qty, order?.currency, order?.exchangeRate)}
                                        {disabled && <div className={styles.itemError}>{eligibilityReason}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>Reason for Return {(returnSettings?.requireReturnReason ?? true) && <span className={styles.required}>*</span>}</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={styles.selectInput}
                        >
                            <option value="">Select a reason</option>
                            {RETURN_REASONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    {type === 'return' && (
                        <div className={styles.formGroup}>
                            <label>Refund Method</label>
                            <select
                                value={refundMethod}
                                onChange={(e) => setRefundMethod(e.target.value)}
                                className={styles.selectInput}
                            >
                                {REFUND_METHODS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label>Additional Notes</label>
                    <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Please provide any additional details about your return request..."
                        rows={3}
                        className={styles.textareaInput}
                    />
                </div>
                {type === 'return' && (
                    <div className={styles.summaryBar}>
                        <div className={styles.summaryItem}>
                            <span>Selected Items:</span>
                            <strong>{getSelectedItemsCount()}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span>Subtotal:</span>
                            <strong>
                                
                                {convertAndFormat(calculateRefundBreakdown().subtotal, order?.currency, order?.exchangeRate )}
                            </strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span>Tax:</span>
                            <strong>
                                {convertAndFormat(calculateRefundBreakdown().tax, order?.currency, order?.exchangeRate )}
                            </strong>
                        </div>
                        {calculateRefundBreakdown().shipping > 0 && (
                            <div className={styles.summaryItem}>
                                <span>Shipping Refund:</span>
                                <strong>
                                    {convertAndFormat(calculateRefundBreakdown().shipping, order?.currency, order?.exchangeRate)}
                                </strong>
                            </div>
                        )}
                        <div className={styles.summaryItem}>
                            <span>Estimated Refund:</span>
                            <strong className={styles.refundAmount}>
                                {convertAndFormat(calculateRefundBreakdown().total, order?.currency, order?.exchangeRate)}
                            </strong>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
