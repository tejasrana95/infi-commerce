'use client';

import { useState } from 'react';
import { X, Package, Play, Trash2 } from 'lucide-react';
import Button from '../atoms/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useHoldStore } from '@/store/holdStore';
import { useCartStore } from '@/store/cartStore';
import { format } from 'date-fns';

interface HeldOrdersListProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HeldOrdersList({ isOpen, onClose }: HeldOrdersListProps) {
    const { heldOrders, resumeOrder, deleteHeldOrder } = useHoldStore();
    const { items: currentCartItems, addToCart, clearCart } = useCartStore();
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const handleResume = (orderId: string) => {
        if (currentCartItems.length > 0) {
            const confirmResume = window.confirm(
                'Current cart is not empty. Resuming this order will replace the current cart. Continue?'
            );
            if (!confirmResume) return;
        }

        const order = resumeOrder(orderId);
        if (order) {
            clearCart();
            order.items.forEach((item) => {
                // Re-add items to cart
                addToCart(
                    {
                        id: item.productId,
                        name: item.name,
                        sku: item.sku,
                        price: item.price,
                        stock: 999, // Placeholder
                        image: item.image,
                        type: 'simple',
                        categoryIds: [],
                        taxRate: item.taxRate,
                        taxAmount: item.taxAmount,
                    },
                    undefined,
                    item.quantity
                );
            });
            onClose();
        }
    };

    const handleDelete = (orderId: string) => {
        if (confirmDelete === orderId) {
            deleteHeldOrder(orderId);
            setConfirmDelete(null);
        } else {
            setConfirmDelete(orderId);
            // Reset confirmation after 3 seconds
            setTimeout(() => setConfirmDelete(null), 3000);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-3xl mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Held Orders</h2>
                                <p className="text-sm text-gray-500">
                                    {heldOrders.length} order{heldOrders.length !== 1 ? 's' : ''} on hold
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {heldOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 text-lg font-semibold mb-2">No Held Orders</p>
                                <p className="text-gray-400 text-sm">
                                    Hold orders to retrieve them later
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {heldOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-1">
                                                    {order.customerIdentifier}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Held {format(new Date(order.heldAt), 'MMM dd, yyyy HH:mm')}
                                                </p>
                                                {order.notes && (
                                                    <p className="text-sm text-gray-600 mt-1 italic">
                                                        Note: {order.notes}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-blue-600">
                                                    ${order.total.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Items Preview */}
                                        <div className="border-t pt-3 mb-3">
                                            <div className="space-y-2">
                                                {order.items.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {item.quantity}x {item.name}
                                                        </span>
                                                        <span className="font-semibold">
                                                            ${(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <p className="text-xs text-gray-500 italic">
                                                        +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleResume(order.id)}
                                                variant="primary"
                                                className="flex-1"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Resume Order
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(order.id)}
                                                variant="secondary"
                                                className={confirmDelete === order.id ? 'bg-red-500 text-white hover:bg-red-600' : ''}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {confirmDelete === order.id ? 'Confirm' : ''}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-gray-50">
                        <Button onClick={onClose} variant="secondary" className="w-full">
                            Close
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
