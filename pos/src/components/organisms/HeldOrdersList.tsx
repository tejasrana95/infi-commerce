'use client';

import { useState, useEffect } from 'react';
import { X, Package, Play, Trash2, ArrowRightLeft, Users, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../atoms/Button';
import ConfirmDialog from '../atoms/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useHoldStore } from '@/store/holdStore';
import { useCartStore } from '@/store/cartStore';
import { useUser } from '@/contexts/UserContext';
import { format } from 'date-fns';
import api from '@/services/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface HeldOrdersListProps {
    isOpen: boolean;
    onClose: () => void;
}

interface POSUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export function HeldOrdersList({ isOpen, onClose }: HeldOrdersListProps) {
    const { heldOrders, resumeOrder, deleteHeldOrder, transferOrder, fetchHeldOrders, loading } = useHoldStore();
    const { items: currentCartItems, addToCart, clearCart, setCustomer } = useCartStore();
    const { user } = useUser();
    const [transferOrderId, setTransferOrderId] = useState<string | null>(null);
    const [posUsers, setPosUsers] = useState<POSUser[]>([]);
    const [showAllOrders, setShowAllOrders] = useState(false);
    const [dialogMessage, setDialogMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [resumeConfirm, setResumeConfirm] = useState<{ show: boolean; orderId: string | null }>({ show: false, orderId: null });
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; orderId: string | null }>({ show: false, orderId: null });
    const [errorDialog, setErrorDialog] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
    const { formatPrice } = useCurrency();
    // Fetch held orders when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchHeldOrders(!showAllOrders);
        }
    }, [isOpen, showAllOrders, fetchHeldOrders]);

    // Fetch POS users when modal opens
    useEffect(() => {
        if (!isOpen) return;
        
        (async () => {
            try {
                const users = await api.getPOSUsers();
                setPosUsers(users);
            } catch (error) {
                console.error('Failed to load POS users:', error);
            }
        })();
    }, [isOpen]);

    const handleResume = async (orderId: string) => {
        if (currentCartItems.length > 0) {
            setResumeConfirm({ show: true, orderId });
            return;
        }
        await performResume(orderId);
    };

    const performResume = async (orderId: string) => {
        try {
            const order = await resumeOrder(orderId);
            if (order) {
                clearCart();
                
                // Restore customer if available
                if (order.customerId) {
                    // Convert ObjectId to string if necessary
                    const customerId = typeof order.customerId === 'object' 
                        ? order.customerId?._id
                        : String((order.customerId as unknown as { toString(): string }).toString?.() ?? order.customerId);
                    // Try to fetch full customer details
                    try {
                        let customerDetails
                        if(customerId) customerDetails = await api.getCustomerById(customerId);
                        
                        if (customerDetails) {
                            setCustomer(customerDetails);
                        } else {
                            // Fallback: parse name into first and last
                            const nameParts = order.customerIdentifier?.split(' ') || ['Customer', ''];
                            setCustomer({
                                id: customerId || '',
                                name: order.customerIdentifier,
                                firstName: nameParts[0],
                                lastName: nameParts.slice(1).join(' ') || 'Customer',
                                phone: '',
                                email: '',
                                totalOrders: 0,
                                totalSpent: 0,
                            });
                        }
                    } catch (err) {
                        console.error('Failed to fetch customer details:', err);
                        // Fallback: parse name into first and last
                        const nameParts = order.customerIdentifier?.split(' ') || ['Customer', ''];
                        setCustomer({
                            id: customerId,
                            name: order.customerIdentifier,
                            firstName: nameParts[0],
                            lastName: nameParts.slice(1).join(' ') || 'Customer',
                            phone: '',
                            email: '',
                            totalOrders: 0,
                            totalSpent: 0,
                        });
                    }
                }

                // Re-add items to cart
                order.items.forEach((item) => {
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
        } catch (error) {
            console.error('Failed to resume order:', error);
            setErrorDialog({ show: true, message: 'Failed to resume order. Please try again.' });
        }
    };

    const handleDelete = async (orderId: string) => {
        setDeleteConfirm({ show: true, orderId });
    };

    const performDelete = async (orderId: string) => {
        try {
            await deleteHeldOrder(orderId);
            setDeleteConfirm({ show: false, orderId: null });
        } catch (error) {
            console.error('Failed to delete order:', error);
            setErrorDialog({ show: true, message: 'Failed to delete order. Please try again.' });
        }
    };

    const handleTransfer = async (orderId: string, targetUserId: string) => {
        try {
            await transferOrder(orderId, targetUserId);
            setTransferOrderId(null);
            setDialogMessage({ type: 'success', message: 'Order transferred successfully!' });
            setTimeout(() => setDialogMessage(null), 3000);
        } catch (error) {
            console.error('Failed to transfer order:', error);
            setDialogMessage({ type: 'error', message: 'Failed to transfer order. Please try again.' });
            setTimeout(() => setDialogMessage(null), 5000);
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
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowAllOrders(!showAllOrders)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                    showAllOrders
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                {showAllOrders ? 'All Orders' : 'My Orders'}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-gray-500">Loading held orders...</div>
                            </div>
                        ) : heldOrders.length === 0 ? (
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
                                                {order.assignedToUser && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                                        <Users className="w-3 h-3" />
                                                        <span>Assigned to: {order.assignedToUser.firstName} {order.assignedToUser.lastName}</span>
                                                        {user && order.assignedToUserId === user._id && (
                                                            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {order.notes && (
                                                    <p className="text-sm text-gray-600 mt-1 italic">
                                                        Note: {order.notes}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {formatPrice(order.total)}
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
                                                            {formatPrice((item.price * item.quantity))}
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
                                                className="flex-1 flex items-center justify-center"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Resume Order
                                            </Button>
                                            
                                            {/* Transfer Button */}
                                            {transferOrderId === order.id ? (
                                                <div className="flex-1 flex gap-2">
                                                    <select
                                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                handleTransfer(order.id, e.target.value);
                                                            }
                                                        }}
                                                        defaultValue=""
                                                    >
                                                        <option value="">Select User...</option>
                                                        {posUsers
                                                            .filter((u) => u._id !== order.assignedToUserId)
                                                            .map((posUser) => (
                                                                <option key={posUser._id} value={posUser._id}>
                                                                    {posUser.firstName} {posUser.lastName} ({posUser.role.replace('_', ' ')})
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <Button
                                                        onClick={() => setTransferOrderId(null)}
                                                        variant="secondary"
                                                        size="sm"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => setTransferOrderId(order.id)}
                                                    variant="secondary"
                                                    title="Transfer to another user"
                                                >
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                </Button>
                                            )}
                                            
                                            <Button
                                                onClick={() => handleDelete(order.id)}
                                                variant="secondary"
                                                title="Delete order"
                                            >
                                                <Trash2 className="w-4 h-4" />
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

                {/* Status Dialog */}
                {dialogMessage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`fixed inset-0 z-[60] flex items-center justify-center pointer-events-none`}
                    >
                        <motion.div
                            className={`relative p-6 rounded-lg shadow-xl max-w-sm mx-4 pointer-events-auto ${
                                dialogMessage.type === 'success'
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                            }`}
                            layout
                        >
                            <div className="flex items-start gap-4">
                                {dialogMessage.type === 'success' ? (
                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <p
                                    className={`text-lg font-semibold ${
                                        dialogMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                                    }`}
                                >
                                    {dialogMessage.message}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Resume Confirmation Dialog */}
                <ConfirmDialog
                    open={resumeConfirm.show}
                    onClose={() => setResumeConfirm({ show: false, orderId: null })}
                    onConfirm={() => {
                        if (resumeConfirm.orderId) {
                            performResume(resumeConfirm.orderId);
                        }
                        setResumeConfirm({ show: false, orderId: null });
                    }}
                    title="Resume Order?"
                    message="Current cart is not empty. Resuming this order will replace the current cart. Continue?"
                    confirmText="Yes, Resume"
                    cancelText="Cancel"
                    type="warning"
                />

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    open={deleteConfirm.show}
                    onClose={() => setDeleteConfirm({ show: false, orderId: null })}
                    onConfirm={() => {
                        if (deleteConfirm.orderId) {
                            performDelete(deleteConfirm.orderId);
                        }
                    }}
                    title="Delete Order?"
                    message="Are you sure you want to delete this held order? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />

                {/* Error Dialog */}
                <ConfirmDialog
                    open={errorDialog.show}
                    onClose={() => setErrorDialog({ show: false, message: '' })}
                    onConfirm={() => setErrorDialog({ show: false, message: '' })}
                    title="Error"
                    message={errorDialog.message}
                    confirmText="OK"
                    type="danger"
                />
            </div>
        </AnimatePresence>
    );
}
