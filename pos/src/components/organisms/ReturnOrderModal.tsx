'use client';

import { useState } from 'react';
import { X, RotateCcw, Search, AlertCircle } from 'lucide-react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { ReturnItem, RETURN_REASONS } from '@/types/returns';

interface ReturnOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReturnOrderModal({ isOpen, onClose }: ReturnOrderModalProps) {
    const [step, setStep] = useState<'search' | 'select' | 'confirm'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [order, setOrder] = useState<any>(null);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // TODO: Implement order search API
            // const foundOrder = await api.searchOrder(searchQuery);
            // setOrder(foundOrder);

            // Mock data for now
            await new Promise(resolve => setTimeout(resolve, 500));
            setError('Order search not yet implemented in backend');

            // setStep('select');
        } catch (err: any) {
            setError(err.message || 'Order not found');
        } finally {
            setLoading(false);
        }
    };

    const handleAddReturnItem = (item: any, quantity: number, reason: string) => {
        const returnItem: ReturnItem = {
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantityPurchased: item.quantity,
            quantityToReturn: quantity,
            reason,
            image: item.image,
        };

        setReturnItems([...returnItems, returnItem]);
    };

    const calculateRefund = () => {
        return returnItems.reduce(
            (total, item) => total + item.price * item.quantityToReturn,
            0
        );
    };

    const handleProcessReturn = async () => {
        setLoading(true);
        try {
            // TODO: Implement return processing API
            // await api.processReturn({
            //     originalOrderId: order._id,
            //     items: returnItems,
            //     total: calculateRefund(),
            // });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Reset and close
            setStep('search');
            setSearchQuery('');
            setOrder(null);
            setReturnItems([]);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to process return');
        } finally {
            setLoading(false);
        }
    };

    const resetModal = () => {
        setStep('search');
        setSearchQuery('');
        setOrder(null);
        setReturnItems([]);
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-4xl mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <RotateCcw className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Process Return</h2>
                                <p className="text-sm text-gray-500">
                                    Step {step === 'search' ? '1' : step === 'select' ? '2' : '3'} of 3
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                resetModal();
                                onClose();
                            }}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Step 1: Search Order */}
                        {step === 'search' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Search for Order</h3>
                                <p className="text-gray-600 mb-4 text-sm">
                                    Enter order number, customer phone, or email to find the order
                                </p>

                                <form onSubmit={handleSearch} className="mb-6">
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <Input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Order #, Phone, or Email"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                        <Button type="submit" disabled={loading}>
                                            <Search className="w-4 h-4 mr-2" />
                                            {loading ? 'Searching...' : 'Search'}
                                        </Button>
                                    </div>
                                </form>

                                {error && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex gap-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-yellow-800 mb-1">
                                                    Feature Coming Soon
                                                </p>
                                                <p className="text-sm text-yellow-700">
                                                    Return order processing requires backend API implementation. This feature will:
                                                </p>
                                                <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc space-y-1">
                                                    <li>Search for orders by number, phone, or email</li>
                                                    <li>Allow selecting items to return with reasons</li>
                                                    <li>Calculate refund amounts</li>
                                                    <li>Update inventory and create negative accounting entries</li>
                                                    <li>Generate return receipt</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Select Items (TODO) */}
                        {step === 'select' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Select Items to Return</h3>
                                {/* Item selection UI would go here */}
                            </div>
                        )}

                        {/* Step 3: Confirm Return (TODO) */}
                        {step === 'confirm' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Confirm Return</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span>Total Refund:</span>
                                        <span className="text-green-600">${calculateRefund().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-gray-50 flex gap-3">
                        <Button
                            onClick={() => {
                                if (step === 'search') {
                                    resetModal();
                                    onClose();
                                } else {
                                    setStep('search');
                                }
                            }}
                            variant="secondary"
                            className="flex-1"
                        >
                            {step === 'search' ? 'Cancel' : 'Back'}
                        </Button>
                        {step === 'confirm' && (
                            <Button
                                onClick={handleProcessReturn}
                                variant="primary"
                                className="flex-1"
                                disabled={loading}
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
