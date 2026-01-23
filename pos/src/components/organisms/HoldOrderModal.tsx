'use client';

import { useState } from 'react';
import { X, Package } from 'lucide-react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { useHoldStore } from '@/store/holdStore';
import { useCartStore } from '@/store/cartStore';

interface HoldOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HoldOrderModal({ isOpen, onClose }: HoldOrderModalProps) {
    const [customerIdentifier, setCustomerIdentifier] = useState('');
    const [notes, setNotes] = useState('');
    const { items, getSubtotal, getTaxTotal, getTotal, clearCart } = useCartStore();
    const { holdOrder } = useHoldStore();

    const handleHold = (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerIdentifier.trim()) {
            return;
        }

        if (items.length === 0) {
            return;
        }

        holdOrder(
            customerIdentifier.trim(),
            items,
            getSubtotal(),
            getTaxTotal(),
            getTotal(),
            notes.trim() || undefined
        );

        clearCart();
        setCustomerIdentifier('');
        setNotes('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold">Hold Order</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleHold} className="p-6">
                        <p className="text-gray-600 mb-4 text-sm">
                            Save this order to retrieve later. Enter customer name or phone number.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">
                                Customer Name / Phone *
                            </label>
                            <Input
                                type="text"
                                value={customerIdentifier}
                                onChange={(e) => setCustomerIdentifier(e.target.value)}
                                placeholder="Enter customer name or phone"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any special notes..."
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                            />
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Items:</span>
                                <span className="font-semibold">{items.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total:</span>
                                <span className="font-semibold">${getTotal().toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1"
                                disabled={items.length === 0}
                            >
                                Hold Order
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
