'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { X, CreditCard, Banknote, QrCode, Printer, CheckCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/services/api';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'upi';

export default function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
    const { items, getTotal, getSubtotal, getTaxTotal, clearCart, customer } = useCartStore(); // Added customer
    const { formatPrice, baseCurrency } = useCurrency();
    const total = getTotal();
    const subtotal = getSubtotal();
    const tax = getTaxTotal();
    const grandTotal = total;

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [processing, setProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [cashGiven, setCashGiven] = useState<string>('');
    const mountTime = useRef(Date.now());

    // Reset mount time when modal opens
    useEffect(() => {
        if (isOpen) {
            mountTime.current = Date.now();
        }
    }, [isOpen]);

    const handlePayment = async () => {
        // Debounce: prevent triggering immediately upon open if keys are held
        if (Date.now() - mountTime.current < 400) return;

        setProcessing(true);
        try {
            await api.checkout({
                items: items.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    sku: item.sku,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                    attributes: item.attributes
                })),
                subtotal: subtotal,
                tax: tax,
                total: grandTotal,
                paymentMethod,
                customer: customer || undefined
            });
            setProcessing(false);
            setCompleted(true);
        } catch (error) {
            console.error('Checkout failed:', error);
            setProcessing(false);
            // Handle error UI if needed
        }
    };

    const handlePrintAndClose = () => {
        console.log('Printing receipt...');
        // Real printing logic here (window.print() or WebUSB)
        clearCart();
        setCompleted(false);
        setCashGiven('');
        onSuccess(); // Parent notification
        onClose();
    };

    const change = paymentMethod === 'cash' && cashGiven
        ? parseFloat(cashGiven) - grandTotal
        : 0;

    // Shortcuts within Modal
    useKeyboardShortcuts([
        // Fast Finish in Modal (Pay)
        {
            key: 'Enter',
            ctrlKey: true,
            action: () => {
                if (!completed && !processing && isOpen) handlePayment();
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
                            {items.map(item => (
                                <div key={item.cartId} className="flex justify-between text-sm">
                                    <span className="text-slate-700 truncate pr-2 w-2/3">
                                        {item.quantity}x {item.name}
                                        {item.variantId && <span className="block text-xs text-slate-500">{item.sku}</span>}
                                    </span>
                                    <span className="font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
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
                            <div className="flex justify-between text-3xl font-bold text-blue-600 pt-2">
                                <span>Total</span>
                                <span>{formatPrice(grandTotal)}</span>
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
                                    <PaymentMethodCard
                                        icon={<Banknote size={32} />}
                                        label="Cash"
                                        selected={paymentMethod === 'cash'}
                                        onClick={() => setPaymentMethod('cash')}
                                    />
                                    <PaymentMethodCard
                                        icon={<CreditCard size={32} />}
                                        label="Card"
                                        selected={paymentMethod === 'card'}
                                        onClick={() => setPaymentMethod('card')}
                                    />
                                    <PaymentMethodCard
                                        icon={<QrCode size={32} />}
                                        label="UPI"
                                        selected={paymentMethod === 'upi'}
                                        onClick={() => setPaymentMethod('upi')}
                                    />
                                </div>

                                <div className="flex-1">
                                    {paymentMethod === 'cash' && (
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <label className="block text-sm font-bold text-slate-800 mb-2">Cash Received</label>
                                            <div className="flex gap-4 items-center">
                                                <span className="text-2xl font-bold text-slate-500">{baseCurrency?.symbol || '$'}</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent text-4xl font-bold outline-none placeholder:text-slate-300 text-slate-900"
                                                    placeholder="0.00"
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

                                <button
                                    onClick={handlePayment}
                                    disabled={processing}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl shadow-lg shadow-blue-900/20 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {processing ? "Processing..." : `Complete ${paymentMethod === 'cash' ? 'Cash' : ''} Payment`}
                                    <span className="text-xs bg-black/20 px-2 py-1 rounded font-mono font-normal opacity-80 border border-white/10">Ctrl+Enter</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle size={48} />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-800">Payment Successful!</h2>
                                <p className="text-slate-500">Order #{Math.floor(Math.random() * 10000) + 80000} completed successfully.</p>

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
