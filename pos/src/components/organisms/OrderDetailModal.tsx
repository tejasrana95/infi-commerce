import { Order } from '@/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import StatusBadge from '../atoms/StatusBadge';
import { X, Calendar, User, CreditCard, Banknote, QrCode, Printer, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface OrderDetailModalProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

const paymentIcons = {
    cash: Banknote,
    card: CreditCard,
    upi: QrCode,
    qr: QrCode
};

export default function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
    const { formatPrice } = useCurrency();
    if (!order || !isOpen) return null;
    const PaymentIcon = paymentIcons[order.paymentMethod];

    const handlePrint = () => {
        console.log('Printing receipt for order:', order.orderNumber);
        // In real app: window.print() or WebUSB printing
    };

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{order.orderNumber}</h2>
                            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(order.date).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={order.status} />
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X className="text-slate-500 hover:text-slate-800" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[600px] overflow-y-auto">
                        {/* Customer Info */}
                        <div className="bg-slate-50 rounded-xl p-4 mb-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Customer Information
                            </h3>
                            {typeof order.customerId === 'object' && order.customerId ? (
                                <div className="space-y-1">
                                    <p className="text-slate-900 font-medium">{order.customerId.firstName} {order.customerId.lastName}</p>
                                    <p className="text-sm text-slate-600">{order.customerId.email}</p>
                                    <p className="text-sm text-slate-600">{order.customerId.phone}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-slate-900 font-medium">Walk-in Customer</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Order Items ({order.items.length})
                            </h3>
                            <div className="space-y-3">
                                {order.items.map((item, index) => {
                                    // Find if this item has discount
                                    const discount = order.discountsApplied?.find(
                                        d => d.productId === item.productId && d.variantId === item.variantId
                                    );

                                    const originalTotal = item.price * item.quantity;
                                    let basePrice = item.basePrice || item.price - (item.taxAmount || 0);
                                    
                                    if (discount) {
                                        if (discount.discountType === 'percentage') {
                                            basePrice -= (basePrice * discount.discountAmount) / 100;
                                        } else {
                                            basePrice -= discount.discountAmount;
                                        }
                                    }
                                    const taxAmount = basePrice * ((item.taxRate || 0) / 100);
                                    const finalTotal = (basePrice + taxAmount) * item.quantity;
                                    const hasDiscount = discount;

                                    return (
                                        <div
                                            key={index}
                                            className="flex gap-4 bg-white border border-slate-200 rounded-lg p-3"
                                        >
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                width={16}
                                                height={16}
                                                className="w-16 h-16 object-cover rounded-lg bg-slate-100"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-slate-900 truncate">{item.name}</h4>
                                                <p className="text-xs text-slate-500">{item.sku}</p>
                                                {item.attributes && (
                                                    <div className="flex gap-2 mt-1">
                                                        {Object.entries(item.attributes).map(([key, value]) => (
                                                            <span
                                                                key={key}
                                                                className="text-xs bg-slate-100 px-2 py-0.5 rounded"
                                                            >
                                                                {key}: {value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                                                {hasDiscount ? (
                                                    <div className="space-y-1">
                                                        <p className="text-xs line-through text-slate-400">{formatPrice(originalTotal)}</p>
                                                        <p className="font-bold text-amber-600">{formatPrice(finalTotal)}</p>
                                                        <p className="text-xs text-amber-600">
                                                            {discount.discountType === 'percentage' ? `${discount.discountAmount}% off` : `${formatPrice(discount.discountAmount)} off`}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="font-bold text-slate-900">{formatPrice(finalTotal)}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <PaymentIcon className="w-4 h-4" />
                                Payment Details
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-slate-700">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-700">
                                    <span>Tax</span>
                                    <span>{formatPrice(order.tax)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-blue-600 pt-2 border-t border-blue-200">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600 pt-2">
                                    <span>Payment Method</span>
                                    <span className="font-medium capitalize">{order.paymentMethod}</span>
                                </div>
                                {order.paymentMethod === 'cash' && order.cashReceived && (
                                    <>
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>Cash Received</span>
                                            <span>{formatPrice(order.cashReceived)}</span>
                                        </div>
                                        {order.change && order.change > 0 && (
                                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                                <span>Change</span>
                                                <span>{formatPrice(order.change)}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 className="text-sm font-bold text-yellow-900 mb-2">Notes</h3>
                                <p className="text-sm text-yellow-800">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Print Receipt
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
