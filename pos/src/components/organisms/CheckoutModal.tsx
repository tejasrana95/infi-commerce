'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { X, CreditCard, Banknote, QrCode, Printer, CheckCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/services/api';

import { useStore } from '@/contexts/StoreContext';
import QRPaymentModal from './QRPaymentModal';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'qr';
export default function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
    const { items, getTotal, getSubtotal, getTaxTotal, clearCart, customer } = useCartStore();
    const { formatPrice, baseCurrency } = useCurrency();
    const total = getTotal();
    const subtotal = getSubtotal();
    const tax = getTaxTotal();
    const [showQRModal, setShowQRModal] = useState(false);

    const [cashGiven, setCashGiven] = useState('');
    const [processing, setProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [customerError, setCustomerError] = useState('');
    const mountTime = useRef<number>(Date.now());
    const grandTotal = total;
    const { store } = useStore();
    const { requireCustomerDetails, allowQuickCheckout, defaultPaymentMethod } = store?.posSettings || {};
    const { posPaymentSettings } = store || {};
    const { enabledMethods, qrSettings, cashSettings } = posPaymentSettings || {};
    // Check available methods
    const isCashEnabled = enabledMethods?.cash !== false;
    const isCardEnabled = enabledMethods?.card !== false;
    const isQrEnabled = enabledMethods?.qr === true;

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>((defaultPaymentMethod as PaymentMethod) || 'cash');

    // Rounding Logic
    const getRoundedTotal = () => {
        if (paymentMethod === 'cash' && cashSettings?.enableRoundOff) {
            const factor = cashSettings.roundOffTo === 'nearest5' ? 5 : (cashSettings.roundOffTo === 'nearest10' ? 10 : 1);
            return Math.ceil(grandTotal / factor) * factor;
        }
        return grandTotal;
    };

    const payableTotal = getRoundedTotal();
    const isRounded = payableTotal !== grandTotal;

    const change = paymentMethod === 'cash' && cashGiven
        ? parseFloat(cashGiven) - payableTotal
        : 0;

    // Validate exact amount if required
    const isExactAmountRequired = cashSettings?.requireExactAmount || false;
    const isValidCashAmount = paymentMethod === 'cash'
        ? (parseFloat(cashGiven || '0') >= payableTotal) && (!isExactAmountRequired || parseFloat(cashGiven || '0') === payableTotal)
        : true;


    const handlePayment = async () => {
        setCustomerError('');
        if (requireCustomerDetails && !customer) {
            setCustomerError('Customer details are required for checkout.');
            return;
        }

        if (paymentMethod === 'cash' && !isValidCashAmount) {
            if (isExactAmountRequired && parseFloat(cashGiven || '0') !== payableTotal) {
                // Error is handled in UI below
                return;
            }
            if (parseFloat(cashGiven || '0') < payableTotal) {
                return;
            }
        }

        // Debounce: prevent triggering immediately upon open if keys are held
        if (mountTime.current && Date.now() - mountTime.current < 400) return;

        // If QR payment, open modal first
        if (paymentMethod === 'qr') {
            if (!isQrEnabled) {
                return;
            }
            setShowQRModal(true);
            return;
        }

        processCheckout({ paymentMethod });
    };

    const processCheckout = async (data: { paymentMethod: string, paymentStatus?: string, transactionId?: string }) => {
        setProcessing(true);
        try {
            // Build items with original prices and send discount info separately
            const orderItems = items.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                name: item.name,
                sku: item.sku,
                price: item.price, // Original inclusive price from DB
                quantity: item.quantity,
                image: item.image,
                attributes: item.attributes,
                // Send discount info so backend can validate and apply
                discountAmount: item.discountAmount || undefined,
                discountType: item.discountType || undefined,
            }));

            // Build discountsApplied data for audit trail
            const discountsApplied = items
                .filter(item => item.discountAmount)
                .map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    discountAmount: item.discountAmount,
                    discountType: item.discountType,
                    originalPrice: item.basePrice,
                    quantity: item.quantity
                }));

            await api.checkout({
                items: orderItems,
                subtotal: subtotal,
                tax: tax,
                total: payableTotal,
                paymentMethod: data.paymentMethod as any,
                customer: customer || undefined,
                currency: baseCurrency?.code || 'INR',
                paymentId: data.transactionId,
                discountsApplied: discountsApplied.length > 0 ? discountsApplied : undefined,
            });
            setProcessing(false);
            setCompleted(true);
        } catch (error) {
            console.error('Checkout failed:', error);
            setProcessing(false);
        }
    };

    const handleQRPaymentSuccess = (paymentData: any) => {
        setShowQRModal(false);
        // Use the actual payment gateway from settings, not 'qr'
        // QR is just the payment interface, the actual payment method is the configured gateway
        let actualPaymentMethod: string = 'qr'; // fallback
        
        // Try to get gateway type from settings first
        if (qrSettings?.mode === 'gateway' && qrSettings?.gatewayConfig?.gatewayType) {
            actualPaymentMethod = qrSettings.gatewayConfig.gatewayType;
        }
        // Fallback to paymentData if available (for backward compatibility)
        else if (paymentData?.gatewayType) {
            actualPaymentMethod = paymentData.gatewayType;
        }
        // Last resort: try to infer from payment ID format
        else if (paymentData?.paymentId) {
            if (paymentData.paymentId.startsWith('pi_') || paymentData.paymentId.startsWith('ch_')) {
                actualPaymentMethod = 'stripe';
            } else if (paymentData.paymentId.startsWith('pay_')) {
                actualPaymentMethod = 'razorpay';
            } else if (paymentData.paymentId.includes('PAYID-')) {
                actualPaymentMethod = 'paypal';
            }
        }
        
        processCheckout({
            paymentMethod: actualPaymentMethod,
            paymentStatus: 'paid',
            transactionId: paymentData.paymentId
        });
    };

    const handlePrintAndClose = () => {
        // Real printing logic here (window.print() or WebUSB)
        clearCart();
        setCompleted(false);
        setCashGiven('');
        onSuccess(); // Parent notification
        onClose();
    };


    // Shortcuts within Modal
    useKeyboardShortcuts([
        // Fast Finish in Modal (Pay) - only if allowQuickCheckout is enabled
        {
            key: 'Enter',
            ctrlKey: true,
            action: () => {
                if (!completed && !processing && isOpen && allowQuickCheckout) handlePayment();
            }
        },
        // Print in Success State
        {
            key: 'p',
            ctrlKey: true,
            action: () => {
                if (completed) handlePrintAndClose();
            }
        },
        // Close on Escape (only if not processing)
        {
            key: 'Escape',
            action: () => {
                if (!processing) {
                    if (completed) handlePrintAndClose(); // If completed, treat Esc as "Close & Finish"
                    else onClose();
                }
            }
        }
    ]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {showQRModal && (
                <QRPaymentModal
                    isOpen={showQRModal}
                    onClose={() => setShowQRModal(false)}
                    onSuccess={handleQRPaymentSuccess}
                    amount={payableTotal} // Use payable total
                    currency={baseCurrency?.code || 'INR'}
                    settings={qrSettings || { mode: 'custom' }} // Fallback
                    customer={customer || undefined}
                />
            )}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex h-[600px]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Left: Summary */}
                    <div className="w-1/3 bg-slate-50 border-r p-6 flex flex-col">
                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-slate-800">
                            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                                {items.length}
                            </span>
                            Order Summary
                        </h3>

                        {/* Customer Info */}
                        <div className="mb-4 bg-white p-3 rounded-lg border flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-900 truncate">{customer ? customer.name : "Walk-in Customer"}</div>
                                <div className="text-xs text-slate-600 truncate">{customer?.phone || "No details"}</div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {items.map(item => {
                                // Calculate effective price with discount
                                let basePrice = item.basePrice;
                                if (item.discountAmount) {
                                    if (item.discountType === 'percentage') {
                                        basePrice -= (item.basePrice * item.discountAmount) / 100;
                                    } else {
                                        basePrice -= item.discountAmount;
                                    }
                                }
                                const taxAmount = basePrice * (item.taxRate / 100);
                                const itemPrice = basePrice + taxAmount;
                                
                                const originalTotal = item.price * item.quantity;
                                const finalTotal = itemPrice * item.quantity;
                                const hasDiscount = item.discountAmount;

                                return (
                                    <div key={item.cartId} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-700 truncate pr-2 w-2/3">
                                                {item.quantity}x {item.name}
                                                {item.variantId && <span className="block text-xs text-slate-500">{item.sku}</span>}
                                            </span>
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <span className="text-xs line-through text-slate-500">{formatPrice(originalTotal)}</span>
                                                    <span className="font-bold text-amber-600">{formatPrice(finalTotal)}</span>
                                                </div>
                                            ) : (
                                                <span className="font-bold text-slate-900">{formatPrice(finalTotal)}</span>
                                            )}
                                        </div>
                                        {item.discountAmount && (
                                            <div className="text-xs text-amber-600 ml-auto">
                                                Discount: {item.discountType === 'percentage' ? `${item.discountAmount}%` : formatPrice(item.discountAmount)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-auto space-y-2 pt-6 border-t">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Tax</span>
                                <span>{formatPrice(tax)}</span>
                            </div>
                            {isRounded && (
                                <div className="flex justify-between text-slate-600 text-sm">
                                    <span>Rounding</span>
                                    <span>{formatPrice(payableTotal - grandTotal)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-3xl font-bold text-blue-600 pt-2">
                                <span>Total</span>
                                <span>{formatPrice(payableTotal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment */}
                    <div className="flex-1 p-8 flex flex-col relative">
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full">
                            <X className="text-slate-500 hover:text-slate-800" />
                        </button>

                        {!completed ? (
                            <>
                                <h2 className="text-2xl font-bold mb-8 text-slate-900">Select Payment Method</h2>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {isCashEnabled && (
                                        <PaymentMethodCard
                                            icon={<Banknote size={32} />}
                                            label="Cash"
                                            selected={paymentMethod === 'cash'}
                                            onClick={() => setPaymentMethod('cash')}
                                        />
                                    )}
                                    {isCardEnabled && (
                                        <PaymentMethodCard
                                            icon={<CreditCard size={32} />}
                                            label="Card"
                                            selected={paymentMethod === 'card'}
                                            onClick={() => setPaymentMethod('card')}
                                        />
                                    )}
                                    {isQrEnabled && (
                                        <PaymentMethodCard
                                            icon={<QrCode size={32} />}
                                            label="QR"
                                            selected={paymentMethod === 'qr'}
                                            onClick={() => setPaymentMethod('qr')}
                                        />
                                    )}
                                </div>

                                <div className="flex-1">
                                    {paymentMethod === 'cash' && (
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-bold text-slate-800">Cash Received</label>
                                                {isExactAmountRequired && (
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">Exact Amount Required</span>
                                                )}
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <span className="text-2xl font-bold text-slate-500">{baseCurrency?.symbol || '$'}</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent text-4xl font-bold outline-none placeholder:text-slate-300 text-slate-900"
                                                    placeholder={payableTotal.toFixed(2)}
                                                    value={cashGiven}
                                                    onChange={(e) => setCashGiven(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            {change > 0 && (
                                                <div className="mt-4 pt-4 border-t flex justify-between items-center text-green-600">
                                                    <span className="font-bold">Change Due</span>
                                                    <span className="text-2xl font-bold">{formatPrice(change)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {customerError && (
                                    <div className="text-red-600 font-semibold mb-2 text-center">{customerError}</div>
                                )}
                                <button
                                    onClick={handlePayment}
                                    disabled={processing || (requireCustomerDetails && !customer) || (paymentMethod === 'cash' && !isValidCashAmount)}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl shadow-lg shadow-blue-900/20 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {processing ? "Processing..." : `Complete ${(paymentMethod === 'cash' ? 'Cash' : (paymentMethod === 'qr' ? 'QR' : 'Card'))} Payment`}
                                    {allowQuickCheckout && <span className="text-xs bg-black/20 px-2 py-1 rounded font-mono font-normal opacity-80 border border-white/10">Ctrl+Enter</span>}
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle size={48} />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-800">Payment Successful!</h2>
                                <p className="text-slate-500">Order completed successfully.</p>

                                <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-8">
                                    <button
                                        onClick={handlePrintAndClose}
                                        className="py-4 bg-slate-800 text-white rounded-xl font-bold text-lg hover:bg-slate-900 flex items-center justify-center gap-2"
                                    >
                                        <Printer size={20} /> Print Receipt <span className="text-sm font-normal opacity-70 ml-1">(Ctrl+P)</span>
                                    </button>
                                    <button
                                        onClick={handlePrintAndClose}
                                        className="py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50"
                                    >
                                        New Sale
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function PaymentMethodCard({ icon, label, selected, onClick }: { icon: React.ReactNode, label: string, selected: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all",
                selected
                    ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
            )}
        >
            {icon}
            <span className="font-bold">{label}</span>
        </button>
    );
}
