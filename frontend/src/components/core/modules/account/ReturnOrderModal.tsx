'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/atoms/Modal';
import styles from './ReturnOrderModal.module.scss';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/services/api-client';
import { useStore } from '@/providers/StoreProvider';
import { useCurrency } from '@/hooks/useCurrency';

import { OrderDetails as OrderDetailsType, OrderItem as OrderItemType } from '@/components/templates/core/OrderDetails';
import { Box, Lock } from 'lucide-react';

interface ReturnOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order?: OrderDetailsType | null;
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
    
    // Bank details form state (for bank_transfer refund method)
    const [bankDetails, setBankDetails] = useState({
        accountHolderName: '',
        bankName: '',
        accountNumber: '', // Can be account number or IBAN
        swiftBicCode: '',
        routingNumber: '',
        accountType: 'checking', // checking or savings
        branchAddress: ''
    });

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

    // Helper to extract error messages from unknown errors
    const getErrorMessage = (err: unknown) => {
        if (!err) return 'Unknown error';
        if (typeof err === 'string') return err;
        if (typeof err === 'object' && err !== null && 'response' in err) {
            return (err as any).response?.data?.message || JSON.stringify(err);
        }
        return JSON.stringify(err);
    };

    // Initialize selected items when order changes
    useEffect(() => {
        if (order?.items) {
            const initialSelection = new Map<string, { quantity: number; checked: boolean }>();
            order.items.forEach((item: OrderItemType) => {
                // Determine unique key - extract productId if it's an object
                const pid = typeof item.productId === 'object' ? (item.productId as any)._id : (item.productId ?? '');
                const key = item.variantId ? `${pid}-${item.variantId}` : pid;
                const maxQty = item.quantity; // In a real app we might subtract already returned qty
                const { eligible } = getEligibility(item, type);
                initialSelection.set(key, { quantity: maxQty, checked: eligible ? true : false });
            });
            setSelectedItems(initialSelection);
        }
    }, [order, type]);

    const handleItemToggle = (itemKey: string) => {
      
        setSelectedItems((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(itemKey);
              console.log('current', newMap);
            if (current) {
                newMap.set(itemKey, { ...current, checked: !current.checked });
            }
            return newMap;
        });
    };

    const getEligibility = (item: OrderItemType, returnType: 'return' | 'exchange'): EligibilityResult => {
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

    const calculateRefundBreakdown = () => {
        if (!order) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };

        let subtotal = 0;
        let tax = 0;
        let shipping = 0;

        order.items.forEach((item: OrderItemType) => {
            const pid = typeof item.productId === 'object' ? (item.productId as any)._id : (item.productId ?? '');
            const key = item.variantId ? `${pid}-${item.variantId}` : pid;
            const selection = selectedItems.get(key as string);
            if (selection?.checked) {
                // Use discounted price if available, otherwise regular price
                const price = item.discountedPrice || item.price || 0;
                subtotal += (price * selection.quantity);
                tax += (item.taxAmount || 0) * selection.quantity;

                // Calculate proportional shipping refund per item
                // shippingCost is stored at item level for the full quantity
                const itemShippingCost = item.shippingCost || 0;
                shipping += itemShippingCost * selection.quantity;
            }
        });

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

        // Validate bank details if bank transfer is selected
        if (refundMethod === 'bank_transfer' && type === 'return') {
            if (!bankDetails.accountHolderName.trim()) {
                setError('Please enter account holder name');
                return;
            }
            if (!bankDetails.bankName.trim()) {
                setError('Please enter bank name');
                return;
            }
            if (!bankDetails.accountNumber.trim()) {
                setError('Please enter account number or IBAN');
                return;
            }
            if (!bankDetails.swiftBicCode.trim()) {
                setError('Please enter SWIFT/BIC code');
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            // Build items array
            const items: Array<{
                productId: string;
                variantId?: string;
                quantity: number;
                name?: string;
                sku?: string;
                refundAmount: number;
            }> = [];

            order.items.forEach((item: OrderItemType) => {
                const pid = typeof item.productId === 'object' ? (item.productId as any)._id : (item.productId ?? '');
                const key = item.variantId ? `${pid}-${item.variantId}` : pid;
                const selection = selectedItems.get(key as string);

                if (selection?.checked) {
                    const price = item.price || 0;
                    const itemSubtotal = price * selection.quantity;
                    const taxAmount = (item.taxAmount || 0) * selection.quantity;
                    const total = itemSubtotal + taxAmount;

                    items.push({
                        productId: typeof item.productId === 'object' ? (item.productId as any)._id : (item.productId as string),
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
                ...(refundMethod === 'bank_transfer' && type === 'return' && { bankDetails }),
            };

            await apiClient.post('returns/create', payload);
            toast.success('Return request submitted successfully');
            onSuccess?.();
            onClose();
        } catch (err: unknown) {
            const message = getErrorMessage(err);
            console.error('Return request failed:', message);
            setError(message || 'Failed to submit return request');
            toast.error(message || 'Failed to submit return request');
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
                        {order?.items?.map((item: OrderItemType) => {
                            // Validation logic
                            const { eligible, reason: eligibilityReason } = getEligibility(item, type);
                            const disabled = !eligible;
                            const pid = typeof item.productId === 'object' ? (item.productId as any)._id : (item.productId ?? '');
                            const key = item.variantId ? `${pid}-${item.variantId}` : pid;
                            const selection = selectedItems.get(key as string);
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
                                            <div className={styles.placeholder}><Box /></div>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Return {(returnSettings?.requireReturnReason ?? true) && <span className={styles.required}>*</span>}</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 bg-white cursor-pointer"
                        >
                            <option value="">Select a reason</option>
                            {RETURN_REASONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    {type === 'return' && (
                        <div className={styles.formGroup}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Refund Method</label>
                            <select
                                value={refundMethod}
                                onChange={(e) => setRefundMethod(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 bg-white cursor-pointer"
                            >
                                {REFUND_METHODS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Bank Details Form - Shows when bank_transfer is selected */}
                {type === 'return' && refundMethod === 'bank_transfer' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank Transfer Details</h3>
                        <p className="text-sm text-gray-600 mb-5">
                            Please provide your bank details. This information will be used securely to process your refund. Works with banks worldwide (US, Canada, Australia, EU, and more).
                        </p>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    value={bankDetails.accountHolderName}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                                    placeholder="Full name as it appears on the bank account"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-500"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    value={bankDetails.bankName}
                                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                    placeholder="e.g., Chase Bank, Barclays, Commonwealth Bank"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-500"
                                />
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number or IBAN <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    value={bankDetails.accountNumber}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                    placeholder="e.g., 1234567890 or IBAN: GB82 WEST 1234 5698 7654 32"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-500 font-mono"
                                />
                                <small className="text-xs text-gray-500 mt-1 block">
                                    Enter your account number or IBAN (commonly used in Europe, Middle East, and Africa)
                                </small>
                            </div>

                            <div className={styles.formGroup}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">IFSC/SWIFT/BIC Code <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    value={bankDetails.swiftBicCode}
                                    onChange={(e) => setBankDetails({ ...bankDetails, swiftBicCode: e.target.value })}
                                    placeholder="e.g., CHAUSUSXX, BARCGB22, CTBAAU2S"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-500 font-mono"
                                />
                                <small className="text-xs text-gray-500 mt-1 block">
                                    Used for international bank transfers worldwide
                                </small>
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number (US/Canada)</label>
                                <input
                                    type="text"
                                    value={bankDetails.routingNumber}
                                    onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
                                    placeholder="Optional - 9 digit US routing number or Canadian transit number"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-500 font-mono"
                                />
                                <small className="text-xs text-gray-500 mt-1 block">
                                    Optional - only needed for US/Canada domestic transfers
                                </small>
                            </div>

                            <div className={styles.formGroup}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                                <select
                                    value={bankDetails.accountType}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountType: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 bg-white cursor-pointer"
                                >
                                    <option value="checking">Checking</option>
                                    <option value="current">Current</option>
                                    <option value="savings">Savings</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Branch Address (Optional)</label>
                            <input
                                type="text"
                                value={bankDetails.branchAddress}
                                onChange={(e) => setBankDetails({ ...bankDetails, branchAddress: e.target.value })}
                                placeholder="e.g., New York, NY or London, UK"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-500"
                            />
                            <small className="text-xs text-gray-500 mt-1 block">
                                Optional - helps identify the correct branch for international transfers
                            </small>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-5">
                            <p className="text-xs text-yellow-800 m-0 flex items-center gap-1">
                                <Lock size={12}/> Your bank details are encrypted and stored securely. They will only be used to process your refund.
                            </p>
                        </div>
                    </div>
                )}

                <div className={styles.formGroup}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Please provide any additional details about your return request..."
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-500 resize-none"
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
                                
                                {convertAndFormat(calculateRefundBreakdown().subtotal, order?.currency ?? 'USD', order?.exchangeRate ?? 1 )}
                            </strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span>Tax:</span>
                            <strong>
                                {convertAndFormat(calculateRefundBreakdown().tax, order?.currency ?? 'USD', order?.exchangeRate ?? 1 )}
                            </strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span>Shipping Refund:</span>
                            <strong>
                                {convertAndFormat(calculateRefundBreakdown().shipping, order?.currency ?? 'USD', order?.exchangeRate ?? 1)}
                            </strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span>Estimated Refund:</span>
                            <strong className={styles.refundAmount}>
                                {convertAndFormat(calculateRefundBreakdown().total, order?.currency ?? 'USD', order?.exchangeRate ?? 1)}
                            </strong>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
