'use client';


import { useState, useEffect } from 'react';
import { X, RotateCcw, Search, AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { ReturnItem, RETURN_REASONS } from '@/types/returns';
import api from '@/services/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import Image from 'next/image';
import Spinner from '../atoms/Spinner';
import { formatDate, formatDateTime } from '@/utils/formatters';

interface ReturnOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialOrder?: any;
}

interface EligibilityResult {
    eligible: boolean;
    reason?: string;
}

export function ReturnOrderModal({ isOpen, onClose, initialOrder }: ReturnOrderModalProps) {
    const { formatPrice } = useCurrency();
    const [step, setStep] = useState<'search' | 'results' | 'select' | 'confirm'>(initialOrder ? 'select' : 'search');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [order, setOrder] = useState<any>(initialOrder || null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [refundMethod, setRefundMethod] = useState<'cash' | 'original'>('cash');
    const [returnReason, setReturnReason] = useState<string>('Other');
    const [notes, setNotes] = useState('');
    const [refundCalculation, setRefundCalculation] = useState<any>(null);
    const [calculatingRefund, setCalculatingRefund] = useState(false);

    // Helper function to check return eligibility for an item
    const getReturnEligibility = (item: any): EligibilityResult => {
        if (!order?.deliveredAt && !order?.createdAt) {
            return { eligible: false, reason: 'Order not yet processed' };
        }

        // 1. Master switch check (isReturnable)
        if (item.isReturnable === false) {
            return { eligible: false, reason: 'This item is not returnable' };
        }

        // 2. Window check using returnWindowDays
        const referenceDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.createdAt);
        const now = new Date();
        const windowDays = item.returnWindowDays ?? 30; // Default to 30 days if not specified

        // Calculate deadline
        const deadline = new Date(referenceDate);
        deadline.setDate(deadline.getDate() + windowDays);

        // Check if current date is past deadline
        if (now > deadline) {
            return {
                eligible: false,
                reason: `Return window closed on ${deadline.toLocaleDateString()}`
            };
        }

        return { eligible: true };
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.length < 3) {
            setError('Please enter at least 3 characters');
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const orders = await api.searchOrders(searchQuery);
            if (orders && orders.length > 0) {
                if (orders.length === 1) {
                    setOrder(orders[0]);
                    setStep('select');
                } else {
                    setSearchResults(orders);
                    setStep('results');
                }
            } else {
                setError('Order not found');
            }
        } catch (err: any) {
            setError(err.message || 'Order not found');
        } finally {
            setLoading(false);
        }
    };


    const getOrderDetails = async (orderId: string) => {
        setIsLoading(true);
        try {
            const orderDetails = await api.getOrderById(orderId);
            setOrder(orderDetails);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch order details');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const orderId = order?._id || order?.id;
        if (orderId && step === 'select' && isOpen) {
            getOrderDetails(orderId);
        }
    }, [step, isOpen]);

    const selectOrder = async (selectedOrder: any) => {
        setOrder(selectedOrder);
        setStep('select');
        setSearchResults([]);
        const orderId = selectedOrder?._id || selectedOrder?.id;
        if (orderId) {
            await getOrderDetails(orderId);
        }
    };

    const handleQuantityChange = async (item: any, qty: number) => {
        if (qty < 0) return;

        // Check return eligibility
        const { eligible } = getReturnEligibility(item);
        if (!eligible) return;

        // Normalize IDs: productId can be object or string
        const productId = typeof item.productId === 'object' ? item.productId._id : item.productId || item._id;
        const variantId = item.variantId || undefined;

        // Calculate max returnable (quantity - returnedQuantity)
        const maxReturnable = item.quantity - (item.returnedQuantity || 0);

        if (qty > maxReturnable) {
            // Can't return more than purchased/remaining
            return;
        }

        const existingIndex = returnItems.findIndex(
            ri => ri.productId === productId && ri.variantId === variantId
        );

        if (qty === 0) {
            if (existingIndex >= 0) {
                setReturnItems(prev => prev.filter((_, i) => i !== existingIndex));
            }
            return;
        }

        const newItem: ReturnItem = {
            productId,
            variantId,
            name: item.name,
            sku: item.sku,
            price: item.price || 0, // This is the price paid (already includes tax and discounts)
            quantityPurchased: item.quantity,
            quantityToReturn: qty,
            reason: returnReason,
            image: item.image || (item.productId && item.productId.images && item.productId.images[0]),
            taxAmount: item.taxAmount || 0,
        };

        let updatedReturnItems: ReturnItem[];
        if (existingIndex >= 0) {
            updatedReturnItems = [...returnItems];
            updatedReturnItems[existingIndex] = newItem;
        } else {
            updatedReturnItems = [...returnItems, newItem];
        }

        setReturnItems(updatedReturnItems);

        // Calculate refund in the background
        if (updatedReturnItems.length > 0) {
            try {
                setCalculatingRefund(true);
                const calculation = await api.calculateRefund(
                    order._id || order.id,
                    updatedReturnItems.map(i => ({
                        productId: i.productId,
                        variantId: i.variantId,
                        quantity: i.quantityToReturn,
                    }))
                );
                setRefundCalculation(calculation);
            } catch (err: any) {
                console.error('Refund calculation error:', err);
                // Don't show error to user, just use simple calculation
                setRefundCalculation(null);
            } finally {
                setCalculatingRefund(false);
            }
        } else {
            setRefundCalculation(null);
        }
    };

    const calculateRefund = () => {
        if (refundCalculation) {
            return refundCalculation.refundAmount;
        }

        // Fallback: simple calculation (sum of prices * quantities)
        return returnItems.reduce(
            (total, item) => total + (item.price + (item?.taxAmount || 0)) * item.quantityToReturn,
            0
        );
    };

    const handleProcessReturn = async () => {
        if (returnItems.length === 0) return;

        setLoading(true);
        setError(null);
        try {
            const finalRefundAmount = calculateRefund();

            await api.processReturn({
                orderId: order._id || order.id,
                items: returnItems.map(i => ({
                    productId: i.productId,
                    variantId: i.variantId,
                    quantity: i.quantityToReturn,
                    reason: i.reason
                })),
                refundAmount: finalRefundAmount,
                refundMethod: refundMethod,
                reason: returnReason,
                notes: notes
            });

            resetModal();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to process return');
        } finally {
            setLoading(false);
        }
    };

    const resetModal = () => {
        if (initialOrder) {
            setStep('select');
            setOrder(initialOrder);
        } else {
            setStep('search');
            setOrder(null);
        }
        setSearchQuery('');
        setSearchResults([]);
        setReturnItems([]);
        setError(null);
        setNotes('');
        setRefundMethod('cash');
        setReturnReason('Other');
        setRefundCalculation(null);
        setCalculatingRefund(false);
    };

    // Use effect to handle prop changes when modal is opened from external source
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen && initialOrder) {
            setOrder(initialOrder);
            setStep('select');
            const oid = initialOrder?._id || initialOrder?.id;
            if (oid) {
                getOrderDetails(oid);
            }
        } else if (isOpen && !initialOrder) {
            setStep('search');
            setOrder(null);
        }
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-4xl mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b bg-white z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <RotateCcw className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Process Return</h2>
                                <p className="text-sm text-slate-500">
                                    {step === 'search' && 'Search order to return'}
                                    {step === 'results' && 'Select an order'}
                                    {step === 'select' && `Select items from Order #${order?.orderNumber}`}
                                    {step === 'confirm' && 'Confirm refund details'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                resetModal();
                                onClose();
                            }}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                        {/* Step 1: Search Order */}
                        {step === 'search' && (
                            <div className=" mx-auto">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Find Order</h3>
                                    <p className="text-slate-600 mb-6 text-sm">
                                        Enter order number, customer phone, or email to find the order.
                                    </p>

                                    <form onSubmit={handleSearch}>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <Input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Order #, Phone, or Email"
                                                    className="w-full"
                                                    autoFocus
                                                />
                                            </div>
                                            <Button type="submit" className='flex items-center ' disabled={loading || searchQuery.length < 3}>
                                                <Search className="w-4 h-4 mr-2" />
                                                {loading ? 'Searching...' : 'Search'}
                                            </Button>
                                        </div>
                                    </form>

                                    {error && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-600">{error}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {
                            step === 'results' && (
                                <div className="mx-auto">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <h3 className="text-lg font-semibold mb-4 text-slate-800">Select Order</h3>
                                        {searchResults.length === 0 ? (
                                            <p className="text-slate-600 text-sm">No orders found.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {searchResults.map((res) => (
                                                    <button
                                                        key={res._id || res.id}
                                                        onClick={() => selectOrder(res)}
                                                        className="w-full text-left p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium text-slate-900">Order #{res.orderNumber}</p>
                                                                <p className="text-sm text-slate-600">
                                                                    {formatDateTime(res.createdAt)} &middot; {typeof res.customerId === 'object' && res.customerId ? `${res.customerId.firstName} ${res.customerId.lastName}` : 'Walk-in Customer'}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-medium text-blue-600">{formatPrice(res.total)}</p>
                                                                <p className="text-sm text-slate-600">{res.items.length} item(s)</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        }
                        {/* Step 2: Select Items */}
                        {step === 'select' && order && (
                            <div className="space-y-6">
                                {/* Order Summary */}
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Spinner size="lg" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                                            <div>
                                                <p className="text-sm text-slate-500">Customer</p>
                                                <p className="font-medium text-slate-900">
                                                    {order.customerId ? `${order.customerId.firstName} ${order.customerId.lastName}` : 'Walk-in Customer'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Date</p>
                                                <p className="font-medium text-slate-900">{formatDateTime(order.createdAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Total Paid</p>
                                                <p className="font-medium text-slate-900">{formatPrice(order.total)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Payment</p>
                                                <p className="font-medium text-slate-900 capitalize">{order.paymentMethod}</p>
                                            </div>
                                        </div>

                                        {!order.createdAt || Math.ceil((new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)) > 30 ? (
                                            <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-semibold text-red-900">Return Window Expired</h4>
                                                    <p className="text-sm text-red-700">
                                                        This order was placed more than 30 days ago and is no longer eligible for return.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null}

                                        {order.returns && order.returns.length > 0 && (
                                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                <p className="text-sm text-slate-600 font-semibold">Previous Returns</p>
                                                <div className="mt-2 space-y-2 text-sm">
                                                    {order.returns.map((r: any) => (
                                                        <div key={r._id} className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium">{new Date(r.returnedAt).toLocaleString()}</p>
                                                                <p className="text-xs text-slate-500">
                                                                    {r.items.map((i: any) => {
                                                                        const prod = order.items.find((oi: any) => {
                                                                            const pid = typeof oi.productId === 'object' ? oi.productId._id : oi.productId || oi._id;
                                                                            return pid === (typeof i.productId === 'object' ? i.productId._id : i.productId);
                                                                        });
                                                                        return `${prod?.name || 'Item'} x${i.quantity}`;
                                                                    }).join(', ')}
                                                                </p>
                                                            </div>
                                                            <div className="font-medium text-green-600">{formatPrice(r.totalRefundAmount || r.refundAmount || 0)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold text-slate-700">Product</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-700 text-center">Purchased</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-700 text-center">Returned</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">Price</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-700 text-center w-32">Return Qty</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {order.items.map((item: any, idx: number) => {
                                                        const productId = typeof item.productId === 'object' ? item.productId._id : item.productId || item._id;
                                                        const variantId = item.variantId || undefined;
                                                        const currentReturnItem = returnItems.find(
                                                            ri => ri.productId === productId && ri.variantId === variantId
                                                        );
                                                        const qtyToReturn = currentReturnItem?.quantityToReturn || 0;
                                                        const maxReturnable = item.quantity - (item.returnedQuantity || 0);
                                                        const isFullyReturned = maxReturnable <= 0;
                                                        // Check eligibility using the new function
                                                        const { eligible: isEligible, reason: ineligibilityReason } = getReturnEligibility(item);
                                                        const imageSrc = item.image || (item.productId && item.productId.images && item.productId.images[0]);

                                                        return (
                                                            <tr key={idx} className={isFullyReturned || !isEligible ? 'bg-slate-50 opacity-60' : ''}>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden relative flex-shrink-0">
                                                                            {imageSrc && (
                                                                                <Image
                                                                                    src={imageSrc}
                                                                                    alt={item.name}
                                                                                    layout="fill"
                                                                                    objectFit="cover"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-slate-900">{item.name}</p>
                                                                            <p className="text-xs text-slate-500">{item.sku}</p>
                                                                            {item.returnedQuantity > 0 && (
                                                                                <p className="text-xs text-amber-600 mt-1">Previously refunded {formatPrice(item.refundedAmount || 0)}</p>
                                                                            )}
                                                                            {!isEligible && (
                                                                                <p className="text-xs text-red-600 mt-1">{ineligibilityReason}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                                <td className="px-4 py-3 text-center text-orange-600 font-medium">{item.returnedQuantity || 0}</td>
                                                                <td className="px-4 py-3 text-right">{formatPrice(item.price + item.taxAmount)}</td>
                                                                <td className="px-4 py-3">
                                                                    {!isFullyReturned && isEligible ? (
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <button
                                                                                onClick={() => handleQuantityChange(item, qtyToReturn - 1)}
                                                                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                                                                                disabled={qtyToReturn <= 0}
                                                                            >
                                                                                -
                                                                            </button>
                                                                            <span className="w-8 text-center font-medium">{qtyToReturn}</span>
                                                                            <button
                                                                                onClick={() => handleQuantityChange(item, qtyToReturn + 1)}
                                                                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                                                                                disabled={qtyToReturn >= maxReturnable}
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-500 text-center block">
                                                                            {!isEligible ? 'Not Eligible' : 'Max Returned'}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>)}
                            </div>
                        )}

                        {/* Step 3: Confirm Return */}
                        {step === 'confirm' && (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        Confirm Return
                                    </h3>

                                    {/* Refund Breakdown */}
                                    {refundCalculation && refundCalculation.breakdown && (
                                        <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <p className="text-sm font-semibold text-slate-700 mb-3">Refund Breakdown</p>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Subtotal (before tax)</span>
                                                    <span className="font-medium text-slate-900">{formatPrice(refundCalculation.breakdown.subtotal)}</span>
                                                </div>
                                                {refundCalculation.breakdown.totalDiscount > 0 && (
                                                    <div className="flex justify-between text-amber-600">
                                                        <span>Discount deducted</span>
                                                        <span>Already applied</span>
                                                    </div>
                                                )}
                                                {refundCalculation.breakdown.couponDiscount > 0 && (
                                                    <div className="flex justify-between text-slate-500 text-xs pl-3">
                                                        <span>↳ Coupon discount</span>
                                                        <span>{formatPrice(refundCalculation.breakdown.couponDiscount)}</span>
                                                    </div>
                                                )}
                                                {refundCalculation.breakdown.manualDiscount > 0 && (
                                                    <div className="flex justify-between text-slate-500 text-xs pl-3">
                                                        <span>↳ Manual discount</span>
                                                        <span>{formatPrice(refundCalculation.breakdown.manualDiscount)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Tax</span>
                                                    <span className="font-medium text-slate-900">{formatPrice(refundCalculation.breakdown.tax)}</span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t border-slate-300">
                                                    <span className="font-bold text-slate-900">Total Refund</span>
                                                    <span className="text-xl font-bold text-green-600">{formatPrice(refundCalculation.breakdown.total)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-slate-600">Items to Return</span>
                                            <span className="font-medium text-slate-900">{returnItems.reduce((acc, i) => acc + i.quantityToReturn, 0)} items</span>
                                        </div>
                                        {!refundCalculation && (
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-slate-600">Refund Amount</span>
                                                <span className="text-xl font-bold text-green-600">{formatPrice(calculateRefund())}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Return Reason</label>
                                            <select
                                                value={returnReason}
                                                onChange={(e) => setReturnReason(e.target.value)}
                                                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white"
                                            >
                                                {RETURN_REASONS.map(reason => (
                                                    <option key={reason} value={reason}>{reason}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Refund Method</label>
                                            <select
                                                value={refundMethod}
                                                onChange={(e) => setRefundMethod(e.target.value as any)}
                                                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white"
                                            >
                                                <option value="cash">Cash Refund</option>
                                                <option value="original">Original Payment ({order?.paymentMethod})</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                                        <Input
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Optional notes about this return"
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-white flex justify-between items-center gap-4">
                        {step === 'search' ? (
                            <Button onClick={onClose} variant="secondary">Cancel</Button>
                        ) : (
                            <Button
                                onClick={() => {
                                    if (step === 'results') setStep('search');
                                    else if (step === 'select') {
                                        if (searchResults.length > 0) setStep('results');
                                        else setStep('search');
                                    }
                                    else if (step === 'confirm') setStep('select');
                                }}
                                variant="secondary"
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Button>
                        )}

                        {step === 'select' && (
                            <Button
                                onClick={() => setStep('confirm')}
                                disabled={returnItems.length === 0}
                                className="px-8"
                            >
                                Next
                            </Button>
                        )}

                        {step === 'confirm' && (
                            <Button
                                onClick={handleProcessReturn}
                                disabled={loading}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-8"
                            >
                                {loading ? 'Processing...' : 'Process Return'}
                            </Button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
