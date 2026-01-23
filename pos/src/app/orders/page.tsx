'use client';

import React, { useState, useMemo } from 'react';
import POCLayout from '@/components/layout/POCLayout';
import OrderCard from '@/components/molecules/OrderCard';
import OrderDetailModal from '@/components/organisms/OrderDetailModal';
import EmptyState from '@/components/molecules/EmptyState';
import { mockOrders } from '@/mock/orders';
import { Order, OrderStatus } from '@/types';
import { Search, Receipt, Filter } from 'lucide-react';
import Input from '@/components/atoms/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OrdersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedOrder(null), 300); // Clear after animation
    };

    // Filter orders
    const filteredOrders = useMemo(() => {
        return mockOrders.filter(order => {
            const matchesSearch =
                order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                '';

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, statusFilter]);

    return (
        <ProtectedRoute>
            <POCLayout>
                <div className="h-full flex flex-col bg-gray-50">
                    {/* Header */}
                    <div className="bg-white border-b px-6 py-4">
                        <h1 className="text-2xl font-bold text-slate-900 mb-4">Order History</h1>

                        {/* Filters */}
                        <div className="flex gap-4 items-center">
                            {/* Search */}
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

                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-slate-500" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                                    className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium"
                                >
                                    <option value="all">All Orders</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 mt-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                                <span className="text-sm text-blue-700">
                                    Showing <span className="font-bold">{filteredOrders.length}</span> of <span className="font-bold">{mockOrders.length}</span> orders
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Order List */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {filteredOrders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredOrders.map(order => (
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

                    {/* Order Detail Modal */}
                    <OrderDetailModal
                        order={selectedOrder}
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                    />
                </div>
            </POCLayout>
        </ProtectedRoute>
    );
}
