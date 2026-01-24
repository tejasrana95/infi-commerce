'use client';

import { useState, useEffect } from 'react';
import { X, Search, FileText, Printer, Calendar, Loader2 } from 'lucide-react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/useToast';


interface OrderHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OrderHistoryModal({ isOpen, onClose }: OrderHistoryModalProps) {
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const { formatPrice } = useCurrency();
    const { toast } = useToast();

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) {
                fetchOrders(1, search);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search, isOpen]);

    const fetchOrders = async (pageNum: number, searchQuery: string) => {
        setLoading(true);
        try {
            const result = await api.getOrders({
                page: pageNum,
                limit: 20,
                search: searchQuery,
            });

            if (pageNum === 1) {
                setOrders(result.data);
            } else {
                setOrders(prev => [...prev, ...result.data]);
            }

            setHasMore(result.pagination.page < result.pagination.pages);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast({
                title: 'Error',
                description: 'Failed to load order history',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
            fetchOrders(page + 1, search);
        }
    };

    const handlePrintReceipt = async (orderId: string) => {
        try {
            const receiptData = await api.getReceiptData(orderId);
            // In a real app, this would trigger the actual printer service
            // For now, we'll just show a success message
            console.log('Printing receipt for:', receiptData);
            toast({
                title: 'Success',
                description: 'Receipt sent to printer',
            });
        } catch (error) {
            console.error('Failed to print receipt:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate receipt',
                variant: 'destructive',
            });
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
                    className="relative w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-slate-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b bg-slate-50 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by Order #, Customer Name or Email..."
                                className="pl-9 bg-white"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Order List */}
                    <div
                        className="flex-1 overflow-y-auto p-4 space-y-3"
                        onScroll={handleScroll}
                    >
                        {orders.length === 0 && !loading ? (
                            <div className="text-center py-12 text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No orders found</p>
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div
                                    key={order._id}
                                    className="border rounded-lg p-4 bg-white hover:border-blue-300 transition-colors group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-800">{order.orderNumber}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(order.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">{formatPrice(order.total, order.currency)}</div>
                                            <div className="text-xs text-slate-500 uppercase">{order.paymentMethod}</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end pt-2 border-t border-dashed">
                                        <div className="text-sm text-slate-600">
                                            {order.customerId?.firstName} {order.customerId?.lastName}
                                            {!order.customerId && (order.guestEmail || 'Guest')}
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handlePrintReceipt(order._id)}
                                        >
                                            <Printer className="w-4 h-4 mr-2" />
                                            Reprint Receipt
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}

                        {loading && (
                            <div className="py-4 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
