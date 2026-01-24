'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, TrendingUp, DollarSign, ShoppingCart, Download } from 'lucide-react';
import Button from '../atoms/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportingDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export function ReportingDashboard({ isOpen, onClose }: ReportingDashboardProps) {
    const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
    const [loading, setLoading] = useState(false);

    // Mock data - replace with actual API calls
    const summaryData = {
        totalSales: 2450.75,
        totalOrders: 32,
        averageOrderValue: 76.59,
        itemsSold: 89,
    };

    const paymentMethodData = [
        { name: 'Cash', value: 1200, percentage: 49 },
        { name: 'Card', value: 850, percentage: 35 },
        { name: 'QR', value: 400.75, percentage: 16 },
    ];

    const topProducts = [
        { name: 'Wireless Headphones', quantity: 12, revenue: 599.88 },
        { name: 'Phone Case', quantity: 25, revenue: 374.75 },
        { name: 'USB Cable', quantity: 18, revenue: 179.82 },
        { name: 'Screen Protector', quantity: 15, revenue: 149.85 },
        { name: 'Power Bank', quantity: 8, revenue: 319.92 },
    ];

    const hourlySales = [
        { hour: '9 AM', sales: 120 },
        { hour: '10 AM', sales: 180 },
        { hour: '11 AM', sales: 250 },
        { hour: '12 PM', sales: 320 },
        { hour: '1 PM', sales: 280 },
        { hour: '2 PM', sales: 310 },
        { hour: '3 PM', sales: 290 },
        { hour: '4 PM', sales: 350 },
        { hour: '5 PM', sales: 270 },
        { hour: '6 PM', sales: 200 },
    ];

    const handleExportCSV = () => {
        // TODO: Implement CSV export
        const csv = 'Date,Orders,Sales\n2026-01-23,32,$2450.75';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${dateRange}.csv`;
        a.click();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-6xl mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Sales Reports</h2>
                                <p className="text-sm text-gray-500">Analytics and insights</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="p-6 border-b bg-gray-50">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <div className="flex gap-2">
                                {(['today', 'yesterday', 'week', 'month'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setDateRange(range)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {range.charAt(0).toUpperCase() + range.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <DollarSign className="w-8 h-8 opacity-80" />
                                </div>
                                <p className="text-2xl font-bold">${summaryData.totalSales.toFixed(2)}</p>
                                <p className="text-sm opacity-90">Total Sales</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <ShoppingCart className="w-8 h-8 opacity-80" />
                                </div>
                                <p className="text-2xl font-bold">{summaryData.totalOrders}</p>
                                <p className="text-sm opacity-90">Orders</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="w-8 h-8 opacity-80" />
                                </div>
                                <p className="text-2xl font-bold">${summaryData.averageOrderValue.toFixed(2)}</p>
                                <p className="text-sm opacity-90">Avg Order Value</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <ShoppingCart className="w-8 h-8 opacity-80" />
                                </div>
                                <p className="text-2xl font-bold">{summaryData.itemsSold}</p>
                                <p className="text-sm opacity-90">Items Sold</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            {/* Hourly Sales Chart */}
                            <div className="bg-white border rounded-lg p-4">
                                <h3 className="font-semibold mb-4">Hourly Sales</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={hourlySales}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" fontSize={12} />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Bar dataKey="sales" fill="#3B82F6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Payment Methods */}
                            <div className="bg-white border rounded-lg p-4">
                                <h3 className="font-semibold mb-4">Payment Methods</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={paymentMethodData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percentage }) => `${name} ${percentage}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {paymentMethodData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-white border rounded-lg p-4">
                            <h3 className="font-semibold mb-4">Top Selling Products</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-2 font-semibold text-sm">Product</th>
                                            <th className="text-center py-2 px-2 font-semibold text-sm">Quantity</th>
                                            <th className="text-right py-2 px-2 font-semibold text-sm">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topProducts.map((product, idx) => (
                                            <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="py-3 px-2 text-sm">{product.name}</td>
                                                <td className="py-3 px-2 text-center text-sm">{product.quantity}</td>
                                                <td className="py-3 px-2 text-right font-semibold text-sm">
                                                    ${product.revenue.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-gray-50 flex gap-3">
                        <Button onClick={handleExportCSV} variant="secondary" className="flex-1">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button onClick={onClose} variant="primary" className="flex-1">
                            Close
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
