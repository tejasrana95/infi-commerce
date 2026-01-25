'use client';

import React, { useState, useEffect, useCallback } from 'react';
import OrderCard from '@/components/molecules/OrderCard';
import OrderDetailModal from '@/components/organisms/OrderDetailModal';
import EmptyState from '@/components/molecules/EmptyState';
import { Order, OrderStatus } from '@/types';
import { Search, Receipt, Filter, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import posApi from '@/services/api';
import { ReturnOrderModal } from '@/components/organisms/ReturnOrderModal';

const ITEMS_PER_PAGE = 12;

export default function OrdersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    const fetchOrders = useCallback(async (page: number) => {
        try {
            setLoading(true);
            setError(null);
            const response = await posApi.getOrders({
                page,
                limit: ITEMS_PER_PAGE,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchQuery || undefined,
            });
            const transformedOrders: Order[] = (response.data || []).map((order: Record<string, unknown>) => ({
                id: order._id,
                orderNumber: order.orderNumber,
                date: order.createdAt,
                status: order.status as OrderStatus,
                customerId: order.customerId,
                items: ((order.items as Array<Record<string, unknown>>) || []).map((item: Record<string, unknown>) => ({
                    productId: (item.productId as Record<string, unknown>)?._id || item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    sku: item.sku || '',
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image || '',
                    attributes: item.selectedAttributes,
                    taxRate: item.taxRate,
                    taxAmount: item.taxAmount,
                })),
                subtotal: order.subtotal,
                tax: order.tax || 0,
                total: order.total,
                paymentMethod: order.paymentMethod as 'cash' | 'card' | 'qr',
                notes: order.notes,
                discount: order.discount || 0,
                couponCode: order.couponCode,
                returns: order.returns,
                discountsApplied: ((order.discountsApplied as Array<Record<string, unknown>>) || []).map((discount: Record<string, unknown>) => ({
                    productId: discount.productId,
                    variantId: discount.variantId,
                    discountAmount: discount.discountAmount,
                    discountType: discount.discountType,
                    originalPrice: discount.originalPrice,
                    quantity: discount.quantity,
                })),
            }));
            setOrders(transformedOrders);
            // Set pagination info from server response
            setTotalOrders(response.pagination?.total || response.data?.length || 0);
            setTotalPages(response.pagination?.pages || 1);
            setCurrentPage(page);
        } catch (err: unknown) {
            const error = err as Record<string, unknown>;
            console.error('Failed to fetch orders:', err);
            setError((error?.message as string) || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchQuery]);

    useEffect(() => {
        fetchOrders(1);
    }, [fetchOrders]);

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedOrder(null), 300);
    };

    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnOrder, setReturnOrder] = useState<Order | null>(null);

    const handleReturnOrder = (order: Order) => {
        setIsModalOpen(false);
        // We'll pass this order to the ReturnOrderModal if it supports pre-filling
        // For now, if ReturnOrderModal is generic, we can just open it.
        // But the modal is designed to search or accept an initial order.
        // Let's assume we can modify ReturnOrderModal to accept an initialOrder prop.
        setReturnOrder(order);
        setIsReturnModalOpen(true);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            fetchOrders(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            fetchOrders(currentPage - 1);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b px-6 py-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">Order History</h1>
                <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by order number or customer name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium"
                        >
                            <option value="all">All Orders</option>
                            <option value="delivered">Delivered</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-4 mt-4 items-center justify-between">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                        <span className="text-sm text-blue-700">
                            Showing <span className="font-bold">{orders.length}</span> orders (Total: <span className="font-bold">{totalOrders}</span>)
                        </span>
                    </div>
                    <button
                        onClick={() => fetchOrders(currentPage)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <span className="text-slate-500">Loading orders...</span>
                        </div>
                    </div>
                ) : error ? (
                    <EmptyState
                        icon={Receipt}
                        title="Error Loading Orders"
                        description={error}
                    />
                ) : orders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onClick={() => handleOrderClick(order)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Receipt}
                        title="No Orders Found"
                        description={
                            searchQuery || statusFilter !== 'all'
                                ? "Try adjusting your search or filter criteria"
                                : "No orders have been placed yet. Start selling to see orders here."
                        }
                    />
                )}
            </div>

            {/* Pagination Controls */}
            {orders.length > 0 && (
                <div className="bg-white border-t px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">
                            Page <span className="text-blue-600 font-bold">{currentPage}</span> of <span className="text-blue-600 font-bold">{totalPages}</span>
                        </span>
                    </div>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            <OrderDetailModal
                order={selectedOrder}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onReturn={handleReturnOrder}
            />

            {/* Return Modal (Reusing the one from Header, but instantiated here) */}
            {/* We need to update ReturnOrderModal to accept 'initialOrder' prop to skip search step */}
            <ReturnOrderModal
                isOpen={isReturnModalOpen}
                onClose={() => {
                    setIsReturnModalOpen(false);
                    setReturnOrder(null);
                }}
                initialOrder={returnOrder}
            />
        </div>
    );
}
